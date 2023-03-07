module.exports = function (wallaby) {
  return {
    autoDetect: true,

    files: [
      'apps/**/*.ts',
      'packages/**/*.ts',
      {pattern: 'apps/**/*.test.ts', ignore: true},
      {pattern: 'packages/**/*.test.ts', ignore: true},
    ],

    tests: ['packages/parser/__tests__/*.ts', 'packages/parser/**/*.test.ts'],

    env: {type: 'node'},

    testFramework: 'wallaby',
  }
}
