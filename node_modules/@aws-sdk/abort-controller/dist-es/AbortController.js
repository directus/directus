import { AbortSignal } from "./AbortSignal";
var AbortController = (function () {
    function AbortController() {
        this.signal = new AbortSignal();
    }
    AbortController.prototype.abort = function () {
        this.signal.abort();
    };
    return AbortController;
}());
export { AbortController };
