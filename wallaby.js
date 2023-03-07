module.exports = function (wallaby) {
  return {
    autoDetect: true,

    files: ['apps/**/*.ts', 'packages/**/*.ts'],

    tests: ['packages/parser/__tests__/*.ts'],

    env: {type: 'node'},
  }
}
