const EventEmitter = require('events');

class ControllerInstance extends EventEmitter{
  constructor(con) {
    super();

    console.log('New Controller Instance');

    this.con = con;

    con.on('close', this.shutdown_instance.bind(this))
    con.on('bind_attempt', this.bind_attempt.bind(this))
  }

  bind_attempt(data) {
    this.emit('bind_attempt', {token: data.token, instance: this});
  }

  bind_status(bind_successful) {
    console.log(`Did we bind? - ${bind_successful}`);
    this.con.send('bind_status', {was_successful: bind_successful});
  }

  shutdown_instance() {
    this.emit('close', this.con.id);
  }
}

module.exports = ControllerInstance;
