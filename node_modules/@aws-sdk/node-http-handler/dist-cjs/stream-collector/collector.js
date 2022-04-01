"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Collector = void 0;
const stream_1 = require("stream");
class Collector extends stream_1.Writable {
    constructor() {
        super(...arguments);
        this.bufferedBytes = [];
    }
    _write(chunk, encoding, callback) {
        this.bufferedBytes.push(chunk);
        callback();
    }
}
exports.Collector = Collector;
