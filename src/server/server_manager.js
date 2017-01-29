// Inbound
// {
//   game_id: 'sadf-sa-asdf',
//   route: 'key-state' || 'heartbeat' || 'disconnect' || 'register',
//   data: {
//     paddle-up: true,
//     paddle-down: false
//   }
// }
//
// Outbound - player
// {
//   route: 'player-connected' || 'player-disconnected' || 'game-state' || 'register',
//   data: {
//     paddle-up: true,
//     paddle-down: false
//   }
// }
//
// Outbound - game-instance
// {
//   route: 'player-connected' || 'player-disconnected' || 'game-state' || 'register',
//   data: {
//     paddle-up: true,
//     paddle-down: false
//   }
// }
const url = require('url');
const GameInstance = require('./game_instance.js');
const Connection = require('./connection.js');

class ServerManager {
  constructor(wss) {
    this.game_instances = {};

    this.wss = wss;

    wss.on('connection', this.on_connection_open.bind(this));
  }

  on_connection_open(ws) {
    const location = url.parse(ws.upgradeReq.url, true);
    let con = new Connection(ws);

    switch(location.href) {
      case '/game':
         let instance = (new GameInstance(con));
        break;
      case '/controller':
        break;
    }

    //ws.on('message', (message) => {
    //  let data = JSON.parse(message);
    //  console.log(JSON.stringify(data, null, 4));
    //});
  }

  remove_instance(ws) {
    console.log('Removing client!');

    this.game_instances[ws] = null;
  }
}

module.exports = ServerManager;
