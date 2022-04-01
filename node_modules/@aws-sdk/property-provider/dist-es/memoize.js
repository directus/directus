import { __awaiter, __generator } from "tslib";
export var memoize = function (provider, isExpired, requiresRefresh) {
    var resolved;
    var pending;
    var hasResult;
    var isConstant = false;
    var coalesceProvider = function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!pending) {
                        pending = provider();
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, , 3, 4]);
                    return [4, pending];
                case 2:
                    resolved = _a.sent();
                    hasResult = true;
                    isConstant = false;
                    return [3, 4];
                case 3:
                    pending = undefined;
                    return [7];
                case 4: return [2, resolved];
            }
        });
    }); };
    if (isExpired === undefined) {
        return function (options) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(!hasResult || (options === null || options === void 0 ? void 0 : options.forceRefresh))) return [3, 2];
                        return [4, coalesceProvider()];
                    case 1:
                        resolved = _a.sent();
                        _a.label = 2;
                    case 2: return [2, resolved];
                }
            });
        }); };
    }
    return function (options) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(!hasResult || (options === null || options === void 0 ? void 0 : options.forceRefresh))) return [3, 2];
                    return [4, coalesceProvider()];
                case 1:
                    resolved = _a.sent();
                    _a.label = 2;
                case 2:
                    if (isConstant) {
                        return [2, resolved];
                    }
                    if (requiresRefresh && !requiresRefresh(resolved)) {
                        isConstant = true;
                        return [2, resolved];
                    }
                    if (!isExpired(resolved)) return [3, 4];
                    return [4, coalesceProvider()];
                case 3:
                    _a.sent();
                    return [2, resolved];
                case 4: return [2, resolved];
            }
        });
    }); };
};
