"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbortController = void 0;
const AbortSignal_1 = require("./AbortSignal");
class AbortController {
    constructor() {
        this.signal = new AbortSignal_1.AbortSignal();
    }
    abort() {
        this.signal.abort();
    }
}
exports.AbortController = AbortController;
