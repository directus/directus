import { __extends } from "tslib";
import { ServiceException as __ServiceException, } from "@aws-sdk/smithy-client";
var STSServiceException = (function (_super) {
    __extends(STSServiceException, _super);
    function STSServiceException(options) {
        var _this = _super.call(this, options) || this;
        Object.setPrototypeOf(_this, STSServiceException.prototype);
        return _this;
    }
    return STSServiceException;
}(__ServiceException));
export { STSServiceException };
