import { __values } from "tslib";
import { ProviderError } from "./ProviderError";
export function chain() {
    var providers = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        providers[_i] = arguments[_i];
    }
    return function () {
        var e_1, _a;
        var promise = Promise.reject(new ProviderError("No providers in chain"));
        var _loop_1 = function (provider) {
            promise = promise.catch(function (err) {
                if (err === null || err === void 0 ? void 0 : err.tryNextLink) {
                    return provider();
                }
                throw err;
            });
        };
        try {
            for (var providers_1 = __values(providers), providers_1_1 = providers_1.next(); !providers_1_1.done; providers_1_1 = providers_1.next()) {
                var provider = providers_1_1.value;
                _loop_1(provider);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (providers_1_1 && !providers_1_1.done && (_a = providers_1.return)) _a.call(providers_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return promise;
    };
}
