export var getResolvedSigningRegion = function (hostname, _a) {
    var signingRegion = _a.signingRegion, regionRegex = _a.regionRegex, useFipsEndpoint = _a.useFipsEndpoint;
    if (signingRegion) {
        return signingRegion;
    }
    else if (useFipsEndpoint) {
        var regionRegexJs = regionRegex.replace("\\\\", "\\").replace(/^\^/g, "\\.").replace(/\$$/g, "\\.");
        var regionRegexmatchArray = hostname.match(regionRegexJs);
        if (regionRegexmatchArray) {
            return regionRegexmatchArray[0].slice(1, -1);
        }
    }
};
