import { getDeck } from './Deck';
import Player, { PLAYER_STATUS } from './Player';
import { arrayShuffle } from '../utils/arrayUtils';

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 80;

const CARDS_FOR_PLAYER = 10;

const GAME_STATUS = {
  WAIT_FOR_PLAYER: 0,
  STARTED: 10,
  COMPLETED: 90
};

export const ERRORS = {
  GAME_END: -1,
  NO_MORE_QUESTIONS: -2
};

const htmlToText = function(str) {
  if (str.indexOf('<b>') < 0) {
    return str;
  }
  if (str.indexOf('<small>') < 0) {
    return str;
  }
  return str.substring(3, str.indexOf('</b>')) + ' ';
};

class Game {
  uuid;

  status;

  players;

  owner;

  deck;

  current_question;

  card_czar;

  current_answers = [];

  rounds = 0;

  max_rounds = 0;

  last_touch;

  playoff = false;

  constructor(name, rounds, expansions = false) {
    this.uuid = name; // uuid.v4();
    this.max_rounds = rounds;
    this.status = GAME_STATUS.WAIT_FOR_PLAYER;
    this.deck = getDeck(expansions);
    this.players = [];
    this.last_touch = Date.now();
  }

  setOwner(player) {
    this.owner = player;
  }

  addPlayer(player_name) {
    if (this.players.length >= MAX_PLAYERS) {
      throw new Error('Too many players');
    }
    if (this.playoff) {
      throw new Error('Game is finished');
    }
    const player = new Player(player_name);
    player.answers = this.deck.answers.splice(0, CARDS_FOR_PLAYER);
    if (this.status > GAME_STATUS.WAIT_FOR_PLAYER) {
      player.setActive(PLAYER_STATUS.WAITING);
    }
    this.players.push(player);
    return player;
  }

  getActivePlayers() {
    return this.players.filter(player => player.isActive());
  }

  getPlayers() {
    return this.getActivePlayers().map(player => {
      const { uuid, name, points } = player;
      return { uuid, name, points };
    });
  }

  getPlayerByUUID(player_uuid) {
    const player = this.players.filter(player => player.uuid === player_uuid)[0];
    return {
      name: player.name,
      uuid: player.uuid
    };
  }

  getFullPlayerByUUID(player_uuid) {
    return this.players.filter(player => player.uuid === player_uuid)[0];
  }

  removePlayer(player_uuid) {
    let change_owner = false;
    let change_czar = false;
    this.players.forEach((player, i) => {
      if (player.uuid === player_uuid) {
        if (i === this.card_czar) {
          change_czar = true;
        }
        if (this.owner.uuid === player_uuid) {
          change_owner = true;
        }
        player.setActive(PLAYER_STATUS.INACTIVE);
      }
    });
    if (this.playoff) {
      const error = new Error('Player left during playoff');
      error.error_code = ERRORS.GAME_END;
      throw error;
    }
    if (this.status >= GAME_STATUS.STARTED && this.getActivePlayers().length < MIN_PLAYERS) {
      const error = new Error('There are too few players! Game ends');
      error.error_code = ERRORS.GAME_END;
      throw error;
    }
    if (this.current_answers.length > 0) {
      this.current_answers = this.current_answers.filter(answer => answer.player_uuid !== player_uuid);
    }
    if (change_czar) {
      this.setCzar();
      const { uuid } = this.players[this.card_czar];
      if (this.current_answers.length > 0) {
        this.current_answers = this.current_answers.filter(answer => answer.player_uuid !== uuid);
      }
    }
    if (change_owner) {
      this.setOwner(this.getActivePlayers()[0]);
    }
    return {
      change_czar,
      change_owner
    };
  }

  start() {
    this.status = GAME_STATUS.STARTED;
    this.card_czar = 0;
    this.current_question = -1;
  }

  setCzar() {
    this.card_czar++;
    if (this.card_czar >= this.getActivePlayers().length) {
      this.card_czar = 0;
    }
    if (!this.players[this.card_czar].isActive()) {
      this.setCzar();
    }
  }

  _getLeaderBoard() {
    return this.players
      .filter(p => p.isActive())
      .sort((a, b) => {
        if (a.points > b.points) return -1;
        if (a.points < b.points) return 1;
        return 0;
      });
  }

  getPlayoff(players) {
    const points = players[0].points;
    let allSamePoints = true;
    const playoff = {
      players: [],
      czar: null
    };
    for (let i = 0; i < players.length; i++) {
      if (points !== players[i].points) {
        allSamePoints = false;
        playoff.czar = {
          uuid: players[i].uuid,
          name: players[i].name
        };
        break;
      }
      playoff.players.push(players[i].uuid);
    }
    if (allSamePoints) {
      return false;
    }
    return playoff;
  }

  needPlayOff() {
    const players = this._getLeaderBoard();
    if (players[0].points > players[1].points) {
      return false;
    }
    const playoff = this.getPlayoff(players);
    if (playoff === false) {
      return playoff;
    }

    return playoff;
  }

  nextRound(onPlayerChanged) {
    this.rounds++;
    let playoff;
    if (this.rounds > this.max_rounds) {
      playoff = this.needPlayOff();
      if (playoff === false) {
        return false;
      }
    } else {
      let players_changed = false;
      this.players.forEach(player => {
        if (player.isWaiting()) {
          players_changed = true;
          player.setActive(PLAYER_STATUS.ACTIVE);
        }
      });
      if (players_changed) {
        onPlayerChanged();
      }
      this.setCzar();
    }
    this.current_question++;
    if (this.current_question >= this.deck.questions.length - 1) {
      const err = new Error('No more questions!');
      err.error_code = ERRORS.NO_MORE_QUESTIONS;
      throw err;
    }
    this.current_answers = [];
    if (!playoff) {
      const { uuid, name } = this.players[this.card_czar];
      return {
        n: this.rounds,
        question: this.deck.questions[this.current_question],
        card_czar: {
          uuid,
          name
        }
      };
    } else {
      this.playoff = playoff;
      return {
        n: -999,
        question: this.deck.questions[this.current_question],
        players: playoff.players,
        card_czar: playoff.czar
      };
    }
  }

  addAnswer(player_uuid, answer) {
    this.current_answers.push({
      player_uuid,
      answer
    });
    const question = this.deck.questions[this.current_question];
    if (answer !== false && question.numAnswers !== answer.length) {
      throw new Error('Invalid answer');
    }
    this.players.forEach(player => {
      if (player.uuid === player_uuid) {
        for (let i = 0; i < question.numAnswers; i++) {
          player.removeButtons(answer ? answer[i] : answer);
        }
        const buttons_to_add = question.numAnswers;
        const answers = this.deck.answers.splice(0, buttons_to_add);
        player.addButtons(answers);
      }
    });
  }

  haveAllAnswers() {
    if (!this.playoff) {
      return this.current_answers.length === this.players.filter(player => player.isActive()).length - 1;
    }
    return this.current_answers.length === this.playoff.players.length;
  }

  getAnswers() {
    const question = this.deck.questions[this.current_question];
    arrayShuffle(this.current_answers);
    return this.current_answers.map(answer => {
      if (!answer.answer) {
        return {
          player_uuid: answer.player_uuid,
          text: false
        };
      }
      let text = htmlToText(question.text);
      if (text.indexOf('_') < 0) {
        for (let i = 0; i < answer.answer.length; i++) {
          text += `&nbsp<strong>${htmlToText(answer.answer[i].text)}</strong>`;
        }
      } else {
        for (let i = 0; i < answer.answer.length; i++) {
          text = text.replace('_', ` <strong>${answer.answer[i].text}</strong> `);
        }
      }

      return {
        player_uuid: answer.player_uuid,
        text
      };
    });
  }

  addPoint(player_uuid) {
    this.players.forEach(player => {
      if (player.uuid === player_uuid) {
        player.points++;
      }
    });
  }
}

export default Game;
