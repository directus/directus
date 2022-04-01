export var fromStatic = function (staticValue) {
    return function () {
        return Promise.resolve(staticValue);
    };
};
