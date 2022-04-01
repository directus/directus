import { __awaiter, __generator } from "tslib";
export var deserializerMiddleware = function (options, deserializer) {
    return function (next, context) {
        return function (args) { return __awaiter(void 0, void 0, void 0, function () {
            var response, parsed, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, next(args)];
                    case 1:
                        response = (_a.sent()).response;
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4, deserializer(response, options)];
                    case 3:
                        parsed = _a.sent();
                        return [2, {
                                response: response,
                                output: parsed,
                            }];
                    case 4:
                        error_1 = _a.sent();
                        Object.defineProperty(error_1, "$response", {
                            value: response,
                        });
                        throw error_1;
                    case 5: return [2];
                }
            });
        }); };
    };
};
