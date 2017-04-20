define([], function () {

  function arraySort(a, b, caseSensitive) {
    var value = 0;

    caseSensitive = !!caseSensitive;
    a = caseSensitive && typeof a === 'string' ? a.toLowerCase() : a;
    b = caseSensitive && typeof b === 'string' ? b.toLowerCase() : b;

    if (a > b) {
      value = 1;
    } else {
      value = -1;
    }

    return value;
  }

  function iArraySort(a, b) {
    return arraySort(a, b, true);
  }

  return {
    arraySort: arraySort,
    iArraySort: iArraySort
  }
});
