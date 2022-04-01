import { __extends } from "tslib";
import { ServiceException as __ServiceException, } from "@aws-sdk/smithy-client";
var SSOServiceException = (function (_super) {
    __extends(SSOServiceException, _super);
    function SSOServiceException(options) {
        var _this = _super.call(this, options) || this;
        Object.setPrototypeOf(_this, SSOServiceException.prototype);
        return _this;
    }
    return SSOServiceException;
}(__ServiceException));
export { SSOServiceException };
