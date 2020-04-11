import assert from 'assert';
import {
  getDateAsString,
  getDateTimeAsString,
  getDateAsMysqlString,
  addMonthsToDate,
  addYearsToDate,
  getTomorrow
} from '../src/utils/dateUtils';
import { lpad } from '../src/utils/stringUtils';

describe('Testing dateUtils', () => {
  describe('Testing addMonthsToDate', () => {
    it('should return the date plus 3 months ', function(done) {
      const date = new Date(1573456024000); // 2019-11-11
      const newdate = addMonthsToDate(date, 3);
      assert.strictEqual(newdate.getFullYear(), 2020);
      assert.strictEqual(newdate.getMonth(), 1, 'Wrong month');
      assert.strictEqual(newdate.getDate(), 11, 'Wrong day');
      done();
    });
    it('should return the date plus 1 month (dafault value) ', function(done) {
      const date = new Date(1573456024000); // 2019-11-11
      const newdate = addMonthsToDate(date);
      assert.strictEqual(newdate.getFullYear(), 2019);
      assert.strictEqual(newdate.getMonth(), 11, 'Wrong month');
      assert.strictEqual(newdate.getDate(), 11, 'Wrong day');
      done();
    });
  });
  describe('Testing addYearsToDate', () => {
    it('should return the date plus 3 years ', function(done) {
      const date = new Date(1573456024000); // 2019-11-11
      const newdate = addYearsToDate(date, 3);
      assert.strictEqual(newdate.getFullYear(), 2022);
      assert.strictEqual(newdate.getMonth(), 10, 'Wrong month');
      assert.strictEqual(newdate.getDate(), 11, 'Wrong day');
      done();
    });

    it('should return the date plus 1 year (default value) ', function(done) {
      const date = new Date(1573456024000); // 2019-11-11
      const newdate = addYearsToDate(date);
      assert.strictEqual(newdate.getFullYear(), 2020);
      assert.strictEqual(newdate.getMonth(), 10, 'Wrong month');
      assert.strictEqual(newdate.getDate(), 11, 'Wrong day');
      done();
    });
  });
  describe('Testing getDateAsMysqlString', () => {
    it('should return a date string in the form YYYY-MM-DD', function(done) {
      const date = new Date(1573456024000); // 2019-11-11
      try {
        const str = getDateAsMysqlString(date);
        assert.strictEqual(typeof str, 'string');
        assert.strictEqual(str, '2019-11-11');
        done();
      } catch (e) {
        done(e);
      }
    });
    it('should return a date string in the form YYYY-MM-DD', function(done) {
      const date = new Date(1547048434000); // 9/1/2019 16:40:34
      const str = getDateAsMysqlString(date);
      assert.strictEqual(typeof str, 'string');
      assert.strictEqual(str, '2019-01-09');
      done();
    });
    it('should return -', function(done) {
      const str = getDateAsMysqlString();
      assert.strictEqual(typeof str, 'string');
      assert.strictEqual(str, '-');
      done();
    });
  });
  describe('Testing getDateAsString', () => {
    it('should return a date string in the form YYYY-MM-DD', function(done) {
      const date = new Date(1573456024000); // 2019-11-11 13:57
      try {
        const str = getDateAsString(date);
        assert.strictEqual(typeof str, 'string');
        assert.strictEqual(str, '11-11-2019');
        done();
      } catch (e) {
        done(e);
      }
    });
    it('should return a date string in the form YYYY-MM-DD', function(done) {
      const date = new Date(1547048434000); // 9/1/2019 16:40:34
      const str = getDateAsString(date);
      assert.strictEqual(typeof str, 'string');
      assert.strictEqual(str, '09-01-2019');
      done();
    });
    it('should return -', function(done) {
      const str = getDateAsString();
      assert.strictEqual(typeof str, 'string');
      assert.strictEqual(str, '-');
      done();
    });
  });
  describe('Testing getDateTimeAsString', () => {
    it('should return a date string in the form YYYY-MM-DD', function(done) {
      const date = new Date(1573481715000); // 2019-11-11 15:15:15
      try {
        const str = getDateTimeAsString(date);
        assert.strictEqual(typeof str, 'string');
        assert.strictEqual(str, '11-11-2019 14:15:15');
        done();
      } catch (e) {
        done(e);
      }
    });
    it('should return a date string in the form YYYY-MM-DD', function(done) {
      const date = new Date(1547017624000); // 9/1/2019 08:7:4
      const str = getDateTimeAsString(date);
      assert.strictEqual(typeof str, 'string');
      assert.strictEqual(str, '09-01-2019 07:07:04');
      done();
    });
    it('should return -', function(done) {
      const str = getDateTimeAsString();
      assert.strictEqual(typeof str, 'string');
      assert.strictEqual(str, '-');
      done();
    });
  });
  describe('Testing getTomorrow', () => {
    const dates = [
      {
        today: new Date('2020-01-01'),
        tomorrow: '2020-01-02T00:00:00.000Z'
      },
      {
        today: new Date('2020-01-31'),
        tomorrow: '2020-02-01T00:00:00.000Z'
      },
      {
        today: new Date('2020-12-31'),
        tomorrow: '2021-01-01T00:00:00.000Z'
      }
    ];
    dates.forEach(o => {
      it('should return a date with one day more', function() {
        const tomorrow = getTomorrow(o.today);
        assert.strictEqual(tomorrow.toISOString(), o.tomorrow);
      });
    });
  });
});

describe('Testing stringUtils', () => {
  describe('lpad', () => {
    it('should return 00001', done => {
      const str = lpad(1, 5, 0);
      assert.strictEqual(str, '00001');
      done();
    });
    it('should return 00001', done => {
      const str = lpad(1, 5);
      assert.strictEqual(str, '00001');
      done();
    });
    it('should return 00001', done => {
      const str = lpad('00001', 5);
      assert.strictEqual(str, '00001');
      done();
    });
  });
});
