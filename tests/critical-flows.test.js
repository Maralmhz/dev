const assert = require('assert');
const { generateStableId, normalizeId } = require('../core_utils.js');

function testIdGeneration() {
  const ids = new Set();
  for (let i = 0; i < 500; i += 1) {
    ids.add(generateStableId('chk'));
  }
  assert.strictEqual(ids.size, 500, 'IDs devem ser únicos');
}

function testNormalizeId() {
  assert.strictEqual(normalizeId(123), '123');
  assert.strictEqual(normalizeId('  abc  '), 'abc');
  assert.strictEqual(normalizeId(null), '');
}

function run() {
  testIdGeneration();
  testNormalizeId();
  console.log('critical-flows: ok');
}

run();
