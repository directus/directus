export var getResolvedPartition = function (region, _a) {
    var _b;
    var partitionHash = _a.partitionHash;
    return (_b = Object.keys(partitionHash || {}).find(function (key) { return partitionHash[key].regions.includes(region); })) !== null && _b !== void 0 ? _b : "aws";
};
