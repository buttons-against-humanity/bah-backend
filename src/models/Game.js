import uuid from 'uuid';
import { getDeck } from './Deck';
import Player from './Player';

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 80;

const CARDS_FOR_PLAYER = 10;

const GAME_STATUS = {
  WAIT_FOR_PLAYER: 0,
  STARTED: 10,
  COMPLETED: 90
};

export const ERRORS = {
  GAME_END: -1
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

  last_touch;

  constructor() {
    this.uuid = uuid.v4();
    this.status = GAME_STATUS.WAIT_FOR_PLAYER;
    this.deck = getDeck();
    this.players = [];
    this.last_touch = Date.now();
  }

  setOwner(player) {
    this.owner = player;
  }

  addPlayer(player_name) {
    if (this.status !== GAME_STATUS.WAIT_FOR_PLAYER) {
      throw new Error('Could not add player at this time');
    }
    if (this.players.length >= MAX_PLAYERS) {
      throw new Error('Too many players');
    }
    const player = new Player(player_name);
    player.answers = this.deck.answers.splice(0, CARDS_FOR_PLAYER);
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
    return this.players.filter(player => player.uuid === player_uuid)[0].name;
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
        player.setActive(false);
      }
    });
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
  }

  nextRound() {
    this.rounds++;
    this.setCzar();
    this.current_question++;
    const checkQuestion = () => {
      return this.deck.questions[this.current_question].numAnswers < 2;
    };
    while (!checkQuestion()) {
      this.current_question++;
    }
    this.current_answers = [];
    const { uuid, name } = this.players[this.card_czar];
    return {
      n: this.rounds,
      question: this.deck.questions[this.current_question],
      card_czar: {
        uuid,
        name
      }
    };
  }

  addAnswer(player_uuid, answer) {
    this.current_answers.push({
      player_uuid,
      answer
    });
    this.players.map(player => {
      if (player.uuid === player_uuid) {
        player.removeCards(answer);
        let cards_to_add = 1;
        if (answer && typeof answer.length !== 'undefined') {
          cards_to_add = answer.length;
        }
        const answers = this.deck.answers.splice(0, cards_to_add);
        player.addCards(answers);
      }
    });
  }

  haveAllAnswers() {
    return this.current_answers.length === this.players.filter(player => player.isActive()).length - 1;
  }

  getAnswers() {
    const question = this.deck.questions[this.current_question];
    return this.current_answers.map(answer => {
      if (!answer.answer) {
        return {
          player_uuid: answer.player_uuid,
          text: false
        };
      }
      let text = question.text;
      if (text.indexOf('_') < 0) {
        text += `<strong>${answer.answer.text}</strong>`;
      } else {
        if (question.numAnswers === 1) {
          text = text.replace('_', ` <strong>${answer.answer.text}</strong> `);
        } else if (question.numAnswers > 1) {
          for (let i = 0; i < question.numAnswers; i++) {
            text = text.replace('_', ` <strong>${answer.answer.text[i]}</strong> `);
          }
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
