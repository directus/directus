import { __assign } from "tslib";
import { getHostnameFromVariants } from "./getHostnameFromVariants";
import { getResolvedHostname } from "./getResolvedHostname";
import { getResolvedPartition } from "./getResolvedPartition";
import { getResolvedSigningRegion } from "./getResolvedSigningRegion";
export var getRegionInfo = function (region, _a) {
    var _b, _c, _d, _e, _f, _g;
    var _h = _a.useFipsEndpoint, useFipsEndpoint = _h === void 0 ? false : _h, _j = _a.useDualstackEndpoint, useDualstackEndpoint = _j === void 0 ? false : _j, signingService = _a.signingService, regionHash = _a.regionHash, partitionHash = _a.partitionHash;
    var partition = getResolvedPartition(region, { partitionHash: partitionHash });
    var resolvedRegion = region in regionHash ? region : (_c = (_b = partitionHash[partition]) === null || _b === void 0 ? void 0 : _b.endpoint) !== null && _c !== void 0 ? _c : region;
    var hostnameOptions = { useFipsEndpoint: useFipsEndpoint, useDualstackEndpoint: useDualstackEndpoint };
    var regionHostname = getHostnameFromVariants((_d = regionHash[resolvedRegion]) === null || _d === void 0 ? void 0 : _d.variants, hostnameOptions);
    var partitionHostname = getHostnameFromVariants((_e = partitionHash[partition]) === null || _e === void 0 ? void 0 : _e.variants, hostnameOptions);
    var hostname = getResolvedHostname(resolvedRegion, { regionHostname: regionHostname, partitionHostname: partitionHostname });
    if (hostname === undefined) {
        throw new Error("Endpoint resolution failed for: ".concat({ resolvedRegion: resolvedRegion, useFipsEndpoint: useFipsEndpoint, useDualstackEndpoint: useDualstackEndpoint }));
    }
    var signingRegion = getResolvedSigningRegion(hostname, {
        signingRegion: (_f = regionHash[resolvedRegion]) === null || _f === void 0 ? void 0 : _f.signingRegion,
        regionRegex: partitionHash[partition].regionRegex,
        useFipsEndpoint: useFipsEndpoint,
    });
    return __assign(__assign({ partition: partition, signingService: signingService, hostname: hostname }, (signingRegion && { signingRegion: signingRegion })), (((_g = regionHash[resolvedRegion]) === null || _g === void 0 ? void 0 : _g.signingService) && {
        signingService: regionHash[resolvedRegion].signingService,
    }));
};
