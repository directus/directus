export var invalidProvider = function (message) { return function () { return Promise.reject(message); }; };
