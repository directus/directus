var AbortSignal = (function () {
    function AbortSignal() {
        this.onabort = null;
        this._aborted = false;
        Object.defineProperty(this, "_aborted", {
            value: false,
            writable: true,
        });
    }
    Object.defineProperty(AbortSignal.prototype, "aborted", {
        get: function () {
            return this._aborted;
        },
        enumerable: false,
        configurable: true
    });
    AbortSignal.prototype.abort = function () {
        this._aborted = true;
        if (this.onabort) {
            this.onabort(this);
            this.onabort = null;
        }
    };
    return AbortSignal;
}());
export { AbortSignal };
