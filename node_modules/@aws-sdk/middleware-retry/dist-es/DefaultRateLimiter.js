import { __awaiter, __generator } from "tslib";
import { isThrottlingError } from "@aws-sdk/service-error-classification";
var DefaultRateLimiter = (function () {
    function DefaultRateLimiter(options) {
        var _a, _b, _c, _d, _e;
        this.currentCapacity = 0;
        this.enabled = false;
        this.lastMaxRate = 0;
        this.measuredTxRate = 0;
        this.requestCount = 0;
        this.lastTimestamp = 0;
        this.timeWindow = 0;
        this.beta = (_a = options === null || options === void 0 ? void 0 : options.beta) !== null && _a !== void 0 ? _a : 0.7;
        this.minCapacity = (_b = options === null || options === void 0 ? void 0 : options.minCapacity) !== null && _b !== void 0 ? _b : 1;
        this.minFillRate = (_c = options === null || options === void 0 ? void 0 : options.minFillRate) !== null && _c !== void 0 ? _c : 0.5;
        this.scaleConstant = (_d = options === null || options === void 0 ? void 0 : options.scaleConstant) !== null && _d !== void 0 ? _d : 0.4;
        this.smooth = (_e = options === null || options === void 0 ? void 0 : options.smooth) !== null && _e !== void 0 ? _e : 0.8;
        var currentTimeInSeconds = this.getCurrentTimeInSeconds();
        this.lastThrottleTime = currentTimeInSeconds;
        this.lastTxRateBucket = Math.floor(this.getCurrentTimeInSeconds());
        this.fillRate = this.minFillRate;
        this.maxCapacity = this.minCapacity;
    }
    DefaultRateLimiter.prototype.getCurrentTimeInSeconds = function () {
        return Date.now() / 1000;
    };
    DefaultRateLimiter.prototype.getSendToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this.acquireTokenBucket(1)];
            });
        });
    };
    DefaultRateLimiter.prototype.acquireTokenBucket = function (amount) {
        return __awaiter(this, void 0, void 0, function () {
            var delay_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.enabled) {
                            return [2];
                        }
                        this.refillTokenBucket();
                        if (!(amount > this.currentCapacity)) return [3, 2];
                        delay_1 = ((amount - this.currentCapacity) / this.fillRate) * 1000;
                        return [4, new Promise(function (resolve) { return setTimeout(resolve, delay_1); })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        this.currentCapacity = this.currentCapacity - amount;
                        return [2];
                }
            });
        });
    };
    DefaultRateLimiter.prototype.refillTokenBucket = function () {
        var timestamp = this.getCurrentTimeInSeconds();
        if (!this.lastTimestamp) {
            this.lastTimestamp = timestamp;
            return;
        }
        var fillAmount = (timestamp - this.lastTimestamp) * this.fillRate;
        this.currentCapacity = Math.min(this.maxCapacity, this.currentCapacity + fillAmount);
        this.lastTimestamp = timestamp;
    };
    DefaultRateLimiter.prototype.updateClientSendingRate = function (response) {
        var calculatedRate;
        this.updateMeasuredRate();
        if (isThrottlingError(response)) {
            var rateToUse = !this.enabled ? this.measuredTxRate : Math.min(this.measuredTxRate, this.fillRate);
            this.lastMaxRate = rateToUse;
            this.calculateTimeWindow();
            this.lastThrottleTime = this.getCurrentTimeInSeconds();
            calculatedRate = this.cubicThrottle(rateToUse);
            this.enableTokenBucket();
        }
        else {
            this.calculateTimeWindow();
            calculatedRate = this.cubicSuccess(this.getCurrentTimeInSeconds());
        }
        var newRate = Math.min(calculatedRate, 2 * this.measuredTxRate);
        this.updateTokenBucketRate(newRate);
    };
    DefaultRateLimiter.prototype.calculateTimeWindow = function () {
        this.timeWindow = this.getPrecise(Math.pow((this.lastMaxRate * (1 - this.beta)) / this.scaleConstant, 1 / 3));
    };
    DefaultRateLimiter.prototype.cubicThrottle = function (rateToUse) {
        return this.getPrecise(rateToUse * this.beta);
    };
    DefaultRateLimiter.prototype.cubicSuccess = function (timestamp) {
        return this.getPrecise(this.scaleConstant * Math.pow(timestamp - this.lastThrottleTime - this.timeWindow, 3) + this.lastMaxRate);
    };
    DefaultRateLimiter.prototype.enableTokenBucket = function () {
        this.enabled = true;
    };
    DefaultRateLimiter.prototype.updateTokenBucketRate = function (newRate) {
        this.refillTokenBucket();
        this.fillRate = Math.max(newRate, this.minFillRate);
        this.maxCapacity = Math.max(newRate, this.minCapacity);
        this.currentCapacity = Math.min(this.currentCapacity, this.maxCapacity);
    };
    DefaultRateLimiter.prototype.updateMeasuredRate = function () {
        var t = this.getCurrentTimeInSeconds();
        var timeBucket = Math.floor(t * 2) / 2;
        this.requestCount++;
        if (timeBucket > this.lastTxRateBucket) {
            var currentRate = this.requestCount / (timeBucket - this.lastTxRateBucket);
            this.measuredTxRate = this.getPrecise(currentRate * this.smooth + this.measuredTxRate * (1 - this.smooth));
            this.requestCount = 0;
            this.lastTxRateBucket = timeBucket;
        }
    };
    DefaultRateLimiter.prototype.getPrecise = function (num) {
        return parseFloat(num.toFixed(8));
    };
    return DefaultRateLimiter;
}());
export { DefaultRateLimiter };
