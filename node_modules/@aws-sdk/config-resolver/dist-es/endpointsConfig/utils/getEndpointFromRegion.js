import { __awaiter, __generator } from "tslib";
export var getEndpointFromRegion = function (input) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, tls, region, dnsHostRegex, useDualstackEndpoint, useFipsEndpoint, hostname;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _a = input.tls, tls = _a === void 0 ? true : _a;
                return [4, input.region()];
            case 1:
                region = _c.sent();
                dnsHostRegex = new RegExp(/^([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])$/);
                if (!dnsHostRegex.test(region)) {
                    throw new Error("Invalid region in client config");
                }
                return [4, input.useDualstackEndpoint()];
            case 2:
                useDualstackEndpoint = _c.sent();
                return [4, input.useFipsEndpoint()];
            case 3:
                useFipsEndpoint = _c.sent();
                return [4, input.regionInfoProvider(region, { useDualstackEndpoint: useDualstackEndpoint, useFipsEndpoint: useFipsEndpoint })];
            case 4:
                hostname = ((_b = (_c.sent())) !== null && _b !== void 0 ? _b : {}).hostname;
                if (!hostname) {
                    throw new Error("Cannot resolve hostname from client config");
                }
                return [2, input.urlParser("".concat(tls ? "https:" : "http:", "//").concat(hostname))];
        }
    });
}); };
