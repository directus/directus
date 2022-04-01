export var getArrayIfSingleItem = function (mayBeArray) {
    return Array.isArray(mayBeArray) ? mayBeArray : [mayBeArray];
};
