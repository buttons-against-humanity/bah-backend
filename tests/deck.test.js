import assert from 'assert';
import { getDeck } from '../src/models/Deck';

describe('Deck test', () => {
  describe('getDeck() test', () => {
    it('should return a shuffled deck', () => {
      const deck1 = getDeck();
      const deck2 = getDeck();
      assert.strictEqual(deck1.questions.length, deck2.questions.length);
      assert.strictEqual(deck1.answers.length, deck2.answers.length);
      assert.strictEqual(
        deck1.questions[0].id !== deck2.questions[0].id ||
          deck1.questions[deck2.questions.length].id !== deck2.questions[deck2.questions.length].id,
        true
      );
      assert.strictEqual(
        deck1.answers[0].id !== deck2.answers[0].id ||
          deck1.answers[deck2.answers.length].id !== deck2.answers[deck2.answers.length].id,
        true
      );
    });

    it('should return a shuffled deck from 1 expansion', () => {
      const expansion = '[C] Mr. Man Collection';
      const deck1 = getDeck([expansion]);
      deck1.questions.forEach(question => {
        assert.strictEqual(
          question.expansion === expansion,
          true,
          `Question must be from "${expansion}" but it's from "${question.expansion}"`
        );
      });
      deck1.answers.forEach(answer => {
        assert.strictEqual(
          answer.expansion === expansion,
          true,
          `Answer must be from "${expansion}" but it's from "${answer.expansion}"`
        );
      });
    });

    it('should return a shuffled deck from 2 expansions', () => {
      const expansion1 = '[C] Mr. Man Collection';
      const expansion2 = 'Reject Pack 2';

      const deck1 = getDeck([expansion1, expansion2]);

      let gotQuestionFromExpansion1 = false;
      let gotQuestionFromExpansion2 = false;
      let gotAnswerFromExpansion1 = false;
      let gotAnswerFromExpansion2 = false;

      deck1.questions.forEach(question => {
        if (!gotQuestionFromExpansion1 && question.expansion === expansion1) {
          gotQuestionFromExpansion1 = true;
        }
        if (!gotQuestionFromExpansion2 && question.expansion === expansion2) {
          gotQuestionFromExpansion2 = true;
        }
        assert.strictEqual(
          question.expansion === expansion1 || question.expansion === expansion2,
          true,
          `Question must be one from "${expansion1}" or "${expansion2}" but it's from "${question.expansion}"`
        );
      });
      deck1.answers.forEach(answer => {
        if (!gotAnswerFromExpansion1 && answer.expansion === expansion1) {
          gotAnswerFromExpansion1 = true;
        }
        if (!gotAnswerFromExpansion2 && answer.expansion === expansion2) {
          gotAnswerFromExpansion2 = true;
        }
        assert.strictEqual(
          answer.expansion === expansion1 || answer.expansion === expansion2,
          true,
          `Answer must be from from "${expansion1}" or "${expansion2}" but it's from "${answer.expansion}"`
        );
      });
      assert.strictEqual(gotQuestionFromExpansion1, true, `Must have been returned a question for ${expansion1}`);
      assert.strictEqual(gotQuestionFromExpansion2, true, `Must have been returned a question for ${expansion2}`);
      assert.strictEqual(gotAnswerFromExpansion1, true, `Must have been returned an answer from ${expansion1}`);
      assert.strictEqual(gotAnswerFromExpansion2, true, `Must have been returned an answer from ${expansion2}`);
    });
  });
});
