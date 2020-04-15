import cards from '../data/cards.json';
import { arrayShuffle } from '../utils/arrayUtils';

const _questions = [];
const _answers = [];

const _expansions = {};

cards.forEach(card => {
  if (!_expansions[card.expansion]) {
    _expansions[card.expansion] = {
      q: 0,
      a: 0
    };
  }
  if (card.cardType === 'Q') {
    _questions.push(card);
    _expansions[card.expansion].q++;
  } else {
    _answers.push(card);
    _expansions[card.expansion].a++;
  }
});

export const getExpansions = function() {
  return _expansions;
};

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
