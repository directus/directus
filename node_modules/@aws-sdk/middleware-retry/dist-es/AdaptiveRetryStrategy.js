import { __awaiter, __extends, __generator, __rest } from "tslib";
import { RETRY_MODES } from "./config";
import { DefaultRateLimiter } from "./DefaultRateLimiter";
import { StandardRetryStrategy } from "./StandardRetryStrategy";
var AdaptiveRetryStrategy = (function (_super) {
    __extends(AdaptiveRetryStrategy, _super);
    function AdaptiveRetryStrategy(maxAttemptsProvider, options) {
        var _this = this;
        var _a = options !== null && options !== void 0 ? options : {}, rateLimiter = _a.rateLimiter, superOptions = __rest(_a, ["rateLimiter"]);
        _this = _super.call(this, maxAttemptsProvider, superOptions) || this;
        _this.rateLimiter = rateLimiter !== null && rateLimiter !== void 0 ? rateLimiter : new DefaultRateLimiter();
        _this.mode = RETRY_MODES.ADAPTIVE;
        return _this;
    }
    AdaptiveRetryStrategy.prototype.retry = function (next, args) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2, _super.prototype.retry.call(this, next, args, {
                        beforeRequest: function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                return [2, this.rateLimiter.getSendToken()];
                            });
                        }); },
                        afterRequest: function (response) {
                            _this.rateLimiter.updateClientSendingRate(response);
                        },
                    })];
            });
        });
    };
    return AdaptiveRetryStrategy;
}(StandardRetryStrategy));
export { AdaptiveRetryStrategy };
