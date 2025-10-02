const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const scriptPath = path.join(__dirname, '..', 'script.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

const elementStub = {};
Object.assign(elementStub, {
  addEventListener: () => {},
  removeEventListener: () => {},
  appendChild: () => {},
  removeChild: () => {},
  setAttribute: () => {},
  removeAttribute: () => {},
  focus: () => {},
  click: () => {},
  submit: () => {},
  reset: () => {},
  querySelector: () => elementStub,
  querySelectorAll: () => [],
  cloneNode: () => elementStub,
  classList: {
    add: () => {},
    remove: () => {},
    toggle: () => {},
    contains: () => false,
  },
  style: {},
  dataset: {},
  innerHTML: '',
  textContent: '',
  value: '',
});

const documentStub = {
  addEventListener: () => {},
  removeEventListener: () => {},
  querySelector: () => elementStub,
  querySelectorAll: () => [],
  createElement: () => elementStub,
  getElementById: () => elementStub,
  body: elementStub,
};

const localStorageStub = (() => {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
})();

const sandbox = {
  console,
  document: documentStub,
  window: {},
  navigator: {},
  localStorage: localStorageStub,
  setInterval: () => 0,
  clearInterval: () => {},
  setTimeout,
  clearTimeout,
  Date,
  Math,
};

vm.createContext(sandbox);
vm.runInContext(scriptContent, sandbox);

const { sanitizeHTML, normalizeCollection } = sandbox;

assert.strictEqual(typeof sanitizeHTML, 'function', 'sanitizeHTML should be defined');
assert.strictEqual(typeof normalizeCollection, 'function', 'normalizeCollection should be defined');

assert.strictEqual(sanitizeHTML(null), '', 'Null input should return empty string');
assert.strictEqual(sanitizeHTML(undefined), '', 'Undefined input should return empty string');
assert.strictEqual(sanitizeHTML(123), '123', 'Numeric input should convert to string');
assert.strictEqual(sanitizeHTML('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;', 'HTML tags should be escaped');
assert.strictEqual(sanitizeHTML("O'Reilly"), 'O&#39;Reilly', 'Single quotes should be escaped');
assert.strictEqual(sanitizeHTML('"Double"'), '&quot;Double&quot;', 'Double quotes should be escaped');
assert.strictEqual(sanitizeHTML('& already escaped'), '&amp; already escaped', 'Ampersands should be escaped');

console.log('All sanitizeHTML tests passed.');

const arrayInput = [{ id: 1 }, { id: 2 }];
assert.strictEqual(normalizeCollection(arrayInput), arrayInput, 'Arrays should return the same reference');

const objectInput = { a: { id: 'a' }, b: { id: 'b' } };
const normalizedObject = normalizeCollection(objectInput);
assert.ok(Array.isArray(normalizedObject), 'Objects should normalize to an array');
assert.strictEqual(normalizedObject.length, 2, 'Normalized object should have two entries');
const normalizedIds = Array.from(normalizedObject, item => item.id).sort();
assert.deepStrictEqual(normalizedIds, ['a', 'b'], 'Normalized entries should match the original object values');

const nullResult = normalizeCollection(null);
assert.ok(Array.isArray(nullResult) && nullResult.length === 0, 'Null should normalize to an empty array');
const undefinedResult = normalizeCollection(undefined);
assert.ok(Array.isArray(undefinedResult) && undefinedResult.length === 0, 'Undefined should normalize to an empty array');

console.log('All normalizeCollection tests passed.');
