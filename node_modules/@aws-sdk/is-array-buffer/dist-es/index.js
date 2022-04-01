export var isArrayBuffer = function (arg) {
    return (typeof ArrayBuffer === "function" && arg instanceof ArrayBuffer) ||
        Object.prototype.toString.call(arg) === "[object ArrayBuffer]";
};
