import cards from '../data/cards.json';
import { arrayShuffle } from '../utils/arrayUtils';

const _questions = [];
const _answers = [];

cards.forEach(card => {
  if (card.cardType === 'Q') {
    _questions.push(card);
  } else {
    _answers.push(card);
  }
});

export const getDeck = function() {
  return {
    answers: arrayShuffle(_answers.slice()),
    questions: arrayShuffle(_questions.slice())
  };
};
