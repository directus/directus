export var normalizeProvider = function (input) {
    if (typeof input === "function")
        return input;
    var promisified = Promise.resolve(input);
    return function () { return promisified; };
};
