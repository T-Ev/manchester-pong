const EventEmitter = require('events');

class GameInstance extends EventEmitter{
  constructor(con) {
    super();

    con.on('close', this.shutdown_instance.bind(this))

    this.active_tokens = ['foo'];
    this.con = con;
    this.intervals = [];

    this.generate_token();
    this.intervals.push(setInterval(this.generate_token.bind(this), (1000 * 10)));

    this.gamefield = {
      width: 1070,
      height: 1800,
      paddle_size: 300,
      paddle_offset: 30
    };

    this.players = {
      p1: {
        pos: 400,
        name: 'Bot',
        score: 0,
        controller_instance: null
      },
      p2: {
        pos: 400,
        name: 'Bot',
        score: 0,
        controller_instance: null
      }
    };

    this.ball = {
      x: this.gamefield.width / 2,
      y: this.gamefield.height / 2,
      size: 70,
      vx: 10,
      vy: 8
    };

    this.ball_paused = false;
  }

  game_start() {
    this.intervals.push(setInterval(this.send_game_state.bind(this), (1000 / 34)));
    this.intervals.push(setInterval(this.game_tick.bind(this), (1000 / 60)));

    console.log('new game instance');
  }

  generate_token() {
    var token = parseInt(Math.random() * (9999-1000) + 1000);
    this.active_tokens.unshift(token);

    if(this.active_tokens.length > 4) {
      this.active_tokens.pop();
    }

    this.send_token();
  }

  game_tick() {
    let bfx = this.ball.x + this.ball.vx;
    let bfy = this.ball.y + this.ball.vy;
    let ball_size = this.ball.size;
    let invert_x = false;
    let invert_y = false;

    // Process player movement
    let player_speed = 22;

    for(var key in this.players) {
      let player = this.players[key];
      let player_instance = player.controller_instance;

      if(player_instance) {
        if(player_instance.get_key_state('key_up')) {
          if(player.pos - player_speed > 0) player.pos -= player_speed;
        }

        if(player_instance.get_key_state('key_down')) {
          if(player.pos + player_speed + this.gamefield.paddle_size < this.gamefield.width) player.pos += player_speed;
        }
      }
    }

    // Paddle hit detection
    let in_p1, in_p2;
    let player = this.players.p1;

    in_p1 = bfx < this.gamefield.paddle_offset;
    in_p1 = in_p1 && (bfy + this.ball.size) > player.pos;
    in_p1 = in_p1 && bfy < (player.pos + this.gamefield.paddle_size);

    player = this.players.p2;
    in_p2 = bfx > (this.gamefield.width - this.gamefield.paddle_offset - this.ball.size);
    in_p2 = in_p2 && (bfy + this.ball.size) > player.pos;
    in_p2 = in_p2 && bfy < (player.pos + this.gamefield.paddle_size);

    if(in_p1 || in_p2) {
      invert_x = true;
    }

    // Wall Detection
    if(bfy + ball_size > this.gamefield.height || bfy < 0) invert_y = true;
    if(bfx + ball_size > this.gamefield.width || bfx < 0) {
      if(bfx + ball_size > this.gamefield.width) this.player_scored(1);
      if(bfx < 0) this.player_scored(2);

      invert_x = true;
    }

    if(invert_x) this.ball.vx *= -1;
    if(invert_y) this.ball.vy *= -1;

    // Process ball movement
    if(!this.ball_paused) {
      this.ball.x += this.ball.vx;
      this.ball.y += this.ball.vy;
    }
  }

  player_scored(id) {
    this.ball.x = this.gamefield.width / 2;
    this.ball.y = this.gamefield.height / 2;

    this.players[`p${id}`].score++;

    this.ball_paused = true;
    setTimeout(() => {
      this.ball_paused = false;
    }, 2000);
  }

  send_token() {
    let current_token = this.active_tokens[0];

    let data = { current_join_token: current_token };

    this.con.send('token', data);
  }

  send_game_state() {
    let p1 = this.players.p1;
    let p2 = this.players.p2;
    let current_token = this.active_tokens[0];

    let data = {
      current_join_token: current_token,
      p1: {
        pos: p1.pos,
        score: p1.score,
        name: p1.name
      },
      p2: {
        pos: p2.pos,
        score: p2.score,
        name: p2.name
      }
    };

    data.ball = this.ball;
    data.gamefield = this.gamefield;

    this.con.send('game_state', data);
  }

  is_token_valid(token) {
    console.log(this.active_tokens);
    return this.active_tokens.indexOf(parseInt(token)) !== -1;
  }

  is_game_full() {
    return (!!this.players.p1.controller_instance && !!this.players.p2.controller_instance);
  }

  join_game(controller_instance) {
    console.log('player joinging');
    if(!this.players.p1.controller_instance) {
      controller_instance.on('close', () => {
        this.remove_player(1);
      });

      this.add_player(1, controller_instance);
    } else if(!this.players.p2.controller_instance) {
      controller_instance.on('close', () => {
        this.remove_player(2);
      });

      this.add_player(2, controller_instance);
    }

    console.log(this.players);
  }

  add_player(id, player) {
    this.players[`p${id}`].controller_instance = player;
    this.players[`p${id}`].name = `Player ${id}`;

    this.con.send('player_join', {id: id});

    // If we are the last player needed...
    if(id == 2) {
      this.players.p1.controller_instance.con.send('game_start');
      this.players.p2.controller_instance.con.send('game_start');

      this.game_start();
    }
  }

  remove_player(id) {
    this.players[`p${id}`].controller_instance = null;
    this.players[`p${id}`].name = "Bot";

    this.con.send('player_left', {id: id});
  }

  shutdown_instance() {
    this.intervals.forEach((interval) => clearInterval(interval));

    this.emit('close', this.con.id);
  }
}

module.exports = GameInstance;
