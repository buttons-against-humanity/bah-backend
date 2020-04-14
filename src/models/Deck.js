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

export const getDeck = function(expansions) {
  return {
    answers: arrayShuffle(
      _answers.filter(answer => (expansions ? expansions.includes(answer.expansion) : true)).slice()
    ),
    questions: arrayShuffle(
      _questions.filter(question => (expansions ? expansions.includes(question.expansion) : true)).slice()
    )
  };
};
