import { __extends } from "tslib";
import { Writable } from "stream";
var Collector = (function (_super) {
    __extends(Collector, _super);
    function Collector() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.bufferedBytes = [];
        return _this;
    }
    Collector.prototype._write = function (chunk, encoding, callback) {
        this.bufferedBytes.push(chunk);
        callback();
    };
    return Collector;
}(Writable));
export { Collector };
