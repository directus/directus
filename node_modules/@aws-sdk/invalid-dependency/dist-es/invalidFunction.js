export var invalidFunction = function (message) { return function () {
    throw new Error(message);
}; };
