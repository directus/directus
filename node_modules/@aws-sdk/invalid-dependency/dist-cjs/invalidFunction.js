"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidFunction = void 0;
const invalidFunction = (message) => () => {
    throw new Error(message);
};
exports.invalidFunction = invalidFunction;
