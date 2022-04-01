import { __extends } from "tslib";
var ProviderError = (function (_super) {
    __extends(ProviderError, _super);
    function ProviderError(message, tryNextLink) {
        if (tryNextLink === void 0) { tryNextLink = true; }
        var _this = _super.call(this, message) || this;
        _this.tryNextLink = tryNextLink;
        _this.name = "ProviderError";
        Object.setPrototypeOf(_this, ProviderError.prototype);
        return _this;
    }
    ProviderError.from = function (error, tryNextLink) {
        if (tryNextLink === void 0) { tryNextLink = true; }
        return Object.assign(new this(error.message, tryNextLink), error);
    };
    return ProviderError;
}(Error));
export { ProviderError };
