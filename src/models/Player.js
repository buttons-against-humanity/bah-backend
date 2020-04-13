import uuid from 'uuid';

class Player {
  uuid;

  name;

  answers;

  points;

  active;

  constructor(name) {
    this.uuid = uuid.v4();
    this.name = name;
    this.points = 0;
    this.active = true;
  }

  isActive() {
    return this.active;
  }

  setActive(active) {
    this.active = active;
  }

  addCards(cards) {
    cards.forEach(card => {
      this.answers.push(card);
    });
  }

  removeCards(cards) {
    const removeRandom = typeof cards === 'boolean';
    const pos = removeRandom ? Math.floor(Math.random() * this.answers.length) : -1;
    this.answers = this.answers.filter((card, i) => {
      if (removeRandom) {
        if (i === pos) {
          return false;
        }
      }
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
