export var getHostnameFromVariants = function (variants, _a) {
    var _b;
    if (variants === void 0) { variants = []; }
    var useFipsEndpoint = _a.useFipsEndpoint, useDualstackEndpoint = _a.useDualstackEndpoint;
    return (_b = variants.find(function (_a) {
        var tags = _a.tags;
        return useFipsEndpoint === tags.includes("fips") && useDualstackEndpoint === tags.includes("dualstack");
    })) === null || _b === void 0 ? void 0 : _b.hostname;
};
