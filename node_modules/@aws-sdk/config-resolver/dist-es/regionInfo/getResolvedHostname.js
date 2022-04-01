export var getResolvedHostname = function (resolvedRegion, _a) {
    var regionHostname = _a.regionHostname, partitionHostname = _a.partitionHostname;
    return regionHostname
        ? regionHostname
        : partitionHostname
            ? partitionHostname.replace("{region}", resolvedRegion)
            : undefined;
};
