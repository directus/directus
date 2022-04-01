import { __assign, __read, __spreadArray } from "tslib";
var HttpRequest = (function () {
    function HttpRequest(options) {
        this.method = options.method || "GET";
        this.hostname = options.hostname || "localhost";
        this.port = options.port;
        this.query = options.query || {};
        this.headers = options.headers || {};
        this.body = options.body;
        this.protocol = options.protocol
            ? options.protocol.slice(-1) !== ":"
                ? "".concat(options.protocol, ":")
                : options.protocol
            : "https:";
        this.path = options.path ? (options.path.charAt(0) !== "/" ? "/".concat(options.path) : options.path) : "/";
    }
    HttpRequest.isInstance = function (request) {
        if (!request)
            return false;
        var req = request;
        return ("method" in req &&
            "protocol" in req &&
            "hostname" in req &&
            "path" in req &&
            typeof req["query"] === "object" &&
            typeof req["headers"] === "object");
    };
    HttpRequest.prototype.clone = function () {
        var cloned = new HttpRequest(__assign(__assign({}, this), { headers: __assign({}, this.headers) }));
        if (cloned.query)
            cloned.query = cloneQuery(cloned.query);
        return cloned;
    };
    return HttpRequest;
}());
export { HttpRequest };
function cloneQuery(query) {
    return Object.keys(query).reduce(function (carry, paramName) {
        var _a;
        var param = query[paramName];
        return __assign(__assign({}, carry), (_a = {}, _a[paramName] = Array.isArray(param) ? __spreadArray([], __read(param), false) : param, _a));
    }, {});
}
