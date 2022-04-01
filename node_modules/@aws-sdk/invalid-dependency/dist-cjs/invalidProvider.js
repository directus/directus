"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidProvider = void 0;
const invalidProvider = (message) => () => Promise.reject(message);
exports.invalidProvider = invalidProvider;
