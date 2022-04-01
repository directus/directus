"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromStatic = void 0;
const fromStatic = (staticValue) => () => Promise.resolve(staticValue);
exports.fromStatic = fromStatic;
