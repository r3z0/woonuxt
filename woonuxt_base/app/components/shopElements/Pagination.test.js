import test from 'node:test';
import assert from 'node:assert';

function numberOfPages(length, productsPerPage) {
  return Math.ceil(length / (productsPerPage || 1));
}

test('uses full length when productsPerPage is undefined', () => {
  assert.strictEqual(numberOfPages(7, undefined), 7);
});

test('uses full length when productsPerPage is 0', () => {
  assert.strictEqual(numberOfPages(7, 0), 7);
});
