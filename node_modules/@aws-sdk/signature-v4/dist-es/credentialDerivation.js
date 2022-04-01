import { __awaiter, __generator, __values } from "tslib";
import { toHex } from "@aws-sdk/util-hex-encoding";
import { KEY_TYPE_IDENTIFIER, MAX_CACHE_SIZE } from "./constants";
var signingKeyCache = {};
var cacheQueue = [];
export var createScope = function (shortDate, region, service) {
    return "".concat(shortDate, "/").concat(region, "/").concat(service, "/").concat(KEY_TYPE_IDENTIFIER);
};
export var getSigningKey = function (sha256Constructor, credentials, shortDate, region, service) { return __awaiter(void 0, void 0, void 0, function () {
    var credsHash, cacheKey, key, _a, _b, signable, e_1_1;
    var e_1, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0: return [4, hmac(sha256Constructor, credentials.secretAccessKey, credentials.accessKeyId)];
            case 1:
                credsHash = _d.sent();
                cacheKey = "".concat(shortDate, ":").concat(region, ":").concat(service, ":").concat(toHex(credsHash), ":").concat(credentials.sessionToken);
                if (cacheKey in signingKeyCache) {
                    return [2, signingKeyCache[cacheKey]];
                }
                cacheQueue.push(cacheKey);
                while (cacheQueue.length > MAX_CACHE_SIZE) {
                    delete signingKeyCache[cacheQueue.shift()];
                }
                key = "AWS4".concat(credentials.secretAccessKey);
                _d.label = 2;
            case 2:
                _d.trys.push([2, 7, 8, 9]);
                _a = __values([shortDate, region, service, KEY_TYPE_IDENTIFIER]), _b = _a.next();
                _d.label = 3;
            case 3:
                if (!!_b.done) return [3, 6];
                signable = _b.value;
                return [4, hmac(sha256Constructor, key, signable)];
            case 4:
                key = _d.sent();
                _d.label = 5;
            case 5:
                _b = _a.next();
                return [3, 3];
            case 6: return [3, 9];
            case 7:
                e_1_1 = _d.sent();
                e_1 = { error: e_1_1 };
                return [3, 9];
            case 8:
                try {
                    if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                }
                finally { if (e_1) throw e_1.error; }
                return [7];
            case 9: return [2, (signingKeyCache[cacheKey] = key)];
        }
    });
}); };
export var clearCredentialCache = function () {
    cacheQueue.length = 0;
    Object.keys(signingKeyCache).forEach(function (cacheKey) {
        delete signingKeyCache[cacheKey];
    });
};
var hmac = function (ctor, secret, data) {
    var hash = new ctor(secret);
    hash.update(data);
    return hash.digest();
};
