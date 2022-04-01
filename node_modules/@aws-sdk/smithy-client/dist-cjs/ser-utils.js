"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeFloat = void 0;
const serializeFloat = (value) => {
    if (value !== value) {
        return "NaN";
    }
    switch (value) {
        case Infinity:
            return "Infinity";
        case -Infinity:
            return "-Infinity";
        default:
            return value;
    }
};
exports.serializeFloat = serializeFloat;
