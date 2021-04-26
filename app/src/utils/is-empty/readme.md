# `isEmpty` / `notEmpty`
Checks if the given value is `null` or `undefined`. Can be used in place of a simple "truthy" check:

Before: `if (value) { ... }`

After: `if (notEmpty(value)) { ... }

## Usage
```js
const a = undefined;
const b = null;
const c = 'test';
const d = 42;
const e = [];
const f = {};

isEmpty(a); // true
isEmpty(b); // true
isEmpty(c); // false
isEmpty(d); // false
isEmpty(e); // false
isEmpty(f); // false

notEmpty(a); // false
notEmpty(b); // false
notEmpty(c); // true
notEmpty(d); // true
notEmpty(e); // true
notEmpty(f); // true
```
