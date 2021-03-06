require('../shared/style.css');

import Vue from 'vue';
import VueRouter from 'vue-router';
import GameConnection from '../shared/game_connection.js';
import jquery from 'jquery';
import VueAnalytics from 'vue-analytics';

import IndexRoute from './routes/index/index.vue';
import GameOverRoute from './routes/game-over/index.vue';
import GameRoute from './routes/game/index.vue';
import LobbyRoute from './routes/lobby/index.vue';

window.$ = jquery;
window.jQuery = jquery;

const routes = [
  { path: '/', component: IndexRoute },
  { path: '/lobby', component: LobbyRoute },
  { path: '/game', component: GameRoute },
  { path: '/game-over', component: GameOverRoute }
];

const router = new VueRouter({
  routes
});


Vue.use(VueRouter);

if(window.location.origin === "http://mhtpong.com") {
  Vue.use(VueAnalytics, {
    id: 'UA-100333942-1',
    router
  });
} else {
  // Mock vue analytics
  Vue.use({
    install(Vue, opts) {
      Vue.prototype.$ga = Vue.$ga = {
        event(name, val) {
          console.log(` Mock GA Event -> ${name} - ${val}`)
        }
      }
    }
  });
}

var Controller = {
  init() {
    this.disable_zoom();

    Vue.prototype.$game_connection = new GameConnection('ws_controller');
    Vue.prototype.$store = {};

    let index_component = require('./root.vue');

    const app = new Vue(Object.assign(index_component, {router: router})).$mount('#app');

    router.replace('/')

    console.log('Welcome to the controller');
  },

  disable_zoom() {
    document.addEventListener('touchmove', function (event) {
      if (event.scale !== 1) { event.preventDefault(); }
    }, false);

    var lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
      var now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
  }
};

$(Controller.init.bind(Controller));
