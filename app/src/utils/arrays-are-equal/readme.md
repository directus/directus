# `arraysAreEqual`
Tests if two given arrays contain the same primitive values. **Note**: this _does not_ check object
equality in arrays.

Based on https://stackoverflow.com/a/55614659/4859211

## Usage
```js
const arr1 = ['a', 'b', 'c'];
const arr2 = [1, 2, 3];
const arr3 = ['a', 'b', 'c'];

arraysAreEqual(arr1, arr2); // false
arraysAreEqual(arr1, arr3); // true
```
