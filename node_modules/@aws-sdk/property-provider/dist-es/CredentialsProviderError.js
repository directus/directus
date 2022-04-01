import { __extends } from "tslib";
import { ProviderError } from "./ProviderError";
var CredentialsProviderError = (function (_super) {
    __extends(CredentialsProviderError, _super);
    function CredentialsProviderError(message, tryNextLink) {
        if (tryNextLink === void 0) { tryNextLink = true; }
        var _this = _super.call(this, message, tryNextLink) || this;
        _this.tryNextLink = tryNextLink;
        _this.name = "CredentialsProviderError";
        Object.setPrototypeOf(_this, CredentialsProviderError.prototype);
        return _this;
    }
    return CredentialsProviderError;
}(ProviderError));
export { CredentialsProviderError };
