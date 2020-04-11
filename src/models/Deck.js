import cards from '../data/cards.json';

const _questions = [];
const _answers = [];

cards.forEach(card => {
  if (card.cardType === 'Q') {
    _questions.push(card);
  } else {
    _answers.push(card);
  }
});

/**
 * From https://gomakethings.com/how-to-shuffle-an-array-with-vanilla-js/
 *
 * @param array
 * @returns array
 */
const shuffle = function(array) {
  var currentIndex = array.length;
  var temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
};

export const getDeck = function() {
  return {
    answers: shuffle(_answers.slice()),
    questions: shuffle(_questions.slice())
  };
};
