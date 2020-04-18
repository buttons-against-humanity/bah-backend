import fetch from 'node-fetch';
import { arrayShuffle } from '../utils/arrayUtils';

const _questions = [];
const _answers = [];

const _expansions = {};

const parseDeck = function(cards) {
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
  return true;
};

export const loadDeck = async function(url) {
  return fetch(url)
    .then(res => res.json())
    .then(json => parseDeck(json));
};

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
