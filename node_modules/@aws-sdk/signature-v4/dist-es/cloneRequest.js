import { __assign, __read, __rest, __spreadArray } from "tslib";
export var cloneRequest = function (_a) {
    var headers = _a.headers, query = _a.query, rest = __rest(_a, ["headers", "query"]);
    return (__assign(__assign({}, rest), { headers: __assign({}, headers), query: query ? cloneQuery(query) : undefined }));
};
export var cloneQuery = function (query) {
    return Object.keys(query).reduce(function (carry, paramName) {
        var _a;
        var param = query[paramName];
        return __assign(__assign({}, carry), (_a = {}, _a[paramName] = Array.isArray(param) ? __spreadArray([], __read(param), false) : param, _a));
    }, {});
};
