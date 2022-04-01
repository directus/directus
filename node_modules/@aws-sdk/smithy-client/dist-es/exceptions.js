import { __extends, __read } from "tslib";
var ServiceException = (function (_super) {
    __extends(ServiceException, _super);
    function ServiceException(options) {
        var _this = _super.call(this, options.message) || this;
        Object.setPrototypeOf(_this, ServiceException.prototype);
        _this.name = options.name;
        _this.$fault = options.$fault;
        _this.$metadata = options.$metadata;
        return _this;
    }
    return ServiceException;
}(Error));
export { ServiceException };
export var decorateServiceException = function (exception, additions) {
    if (additions === void 0) { additions = {}; }
    Object.entries(additions)
        .filter(function (_a) {
        var _b = __read(_a, 2), v = _b[1];
        return v !== undefined;
    })
        .forEach(function (_a) {
        var _b = __read(_a, 2), k = _b[0], v = _b[1];
        if (exception[k] == undefined || exception[k] === "") {
            exception[k] = v;
        }
    });
    var message = exception.message || exception.Message || "UnknownError";
    exception.message = message;
    delete exception.Message;
    return exception;
};
