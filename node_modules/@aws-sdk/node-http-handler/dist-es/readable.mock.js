import { __extends } from "tslib";
import { Readable } from "stream";
var ReadFromBuffers = (function (_super) {
    __extends(ReadFromBuffers, _super);
    function ReadFromBuffers(options) {
        var _this = _super.call(this, options) || this;
        _this.numBuffersRead = 0;
        _this.buffersToRead = options.buffers;
        _this.errorAfter = typeof options.errorAfter === "number" ? options.errorAfter : -1;
        return _this;
    }
    ReadFromBuffers.prototype._read = function () {
        if (this.errorAfter !== -1 && this.errorAfter === this.numBuffersRead) {
            this.emit("error", new Error("Mock Error"));
            return;
        }
        if (this.numBuffersRead >= this.buffersToRead.length) {
            return this.push(null);
        }
        return this.push(this.buffersToRead[this.numBuffersRead++]);
    };
    return ReadFromBuffers;
}(Readable));
export { ReadFromBuffers };
