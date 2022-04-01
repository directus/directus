"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadFromBuffers = void 0;
const stream_1 = require("stream");
class ReadFromBuffers extends stream_1.Readable {
    constructor(options) {
        super(options);
        this.numBuffersRead = 0;
        this.buffersToRead = options.buffers;
        this.errorAfter = typeof options.errorAfter === "number" ? options.errorAfter : -1;
    }
    _read(size) {
        if (this.errorAfter !== -1 && this.errorAfter === this.numBuffersRead) {
            this.emit("error", new Error("Mock Error"));
            return;
        }
        if (this.numBuffersRead >= this.buffersToRead.length) {
            return this.push(null);
        }
        return this.push(this.buffersToRead[this.numBuffersRead++]);
    }
}
exports.ReadFromBuffers = ReadFromBuffers;
