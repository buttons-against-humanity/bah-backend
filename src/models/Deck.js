import fetch from 'node-fetch';
import { arrayShuffle } from '../utils/arrayUtils';

const _questions = [];
const _answers = [];

const _expansions = {};

const parseDeck = function(_deck) {
  let id = 0;
  Object.keys(_deck.decks).forEach(function(deckcode) {
    const deck = _deck.decks[deckcode];
    const q = deck.questions.length;
    const a = deck.answers.length;
    const { code, name, lang, author, url } = deck;
    _expansions[deckcode] = {
      code,
      name,
      lang,
      author,
      url,
      q,
      a
    };
    deck.questions.forEach(question => {
      _questions.push({
        text: question,
        cardType: 'Q',
        numAnswers: question.split('_').length - 1,
        id,
        expansion: deck.code
      });
      id++;
    });
    deck.answers.forEach(question => {
      _answers.push({
        text: question,
        cardType: 'A',
        numAnswers: 0,
        id,
        expansion: deck.code
      });
      id++;
    });
  });
  return true;
};

export const loadDeck = async function(url) {
  return fetch(url)
    .then(res => res.json())
    .then(json => parseDeck(json));
};

export const reLoadDeck = async function(url) {
  return fetch(url)
    .then(res => res.json())
    .then(json => {
      _questions.length = 0;
      _answers.length = 0;
      Object.keys(_expansions).forEach(k => delete _expansions[k]);
      parseDeck(json);
    });
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
