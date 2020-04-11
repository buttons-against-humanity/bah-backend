class MysqlMock {
  static getDbConnection(calls) {
    const { gets, inserts, updates, runs } = calls;
    return {
      get: async (sql, ph) => {
        const ret = await gets[0](sql, ph);
        gets.shift();
        return ret;
      },
      insert: async (sql, ph) => {
        const ret = await inserts[0](sql, ph);
        inserts.shift();
        return ret;
      },
      update: async (sql, ph) => {
        const ret = await updates[0](sql, ph);
        updates.shift();
        return ret;
      },
      run: async (sql, ph) => {
        const ret = await runs[0](sql, ph);
        runs.shift();
        return ret;
      }
    };
  }
}

export default MysqlMock;
