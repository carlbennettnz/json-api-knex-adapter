module.exports = {
  extends: 'otbs',

  env: {
    browser: false,
    es6: true,
    node: true
  },

  rules: {
    indent: [ 2, 2, { SwitchCase: 1, MemberExpression: 1, ObjectExpression: "first" } ]
  }
};
