import uuid from 'uuid';

class Player {
  uuid;

  name;

  answers;

  points;

  constructor(name) {
    this.uuid = uuid.v4();
    this.name = name;
    this.points = 0;
  }

  addCards(cards) {
    cards.forEach(card => {
      this.answers.push(card);
    });
  }

  removeCards(cards) {
    this.answers = this.answers.filter(card => {
      if (typeof cards.length === 'undefined') {
        return card.id !== cards.id;
      }
      for (let i = 0; i < cards.length; i++) {
        if (cards[i].id === card.id) {
          return false;
        }
      }
      return true;
    });
  }
}

export default Player;
