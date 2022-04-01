"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRegionInfo = void 0;
const getHostnameFromVariants_1 = require("./getHostnameFromVariants");
const getResolvedHostname_1 = require("./getResolvedHostname");
const getResolvedPartition_1 = require("./getResolvedPartition");
const getResolvedSigningRegion_1 = require("./getResolvedSigningRegion");
const getRegionInfo = (region, { useFipsEndpoint = false, useDualstackEndpoint = false, signingService, regionHash, partitionHash, }) => {
    var _a, _b, _c, _d, _e, _f;
    const partition = (0, getResolvedPartition_1.getResolvedPartition)(region, { partitionHash });
    const resolvedRegion = region in regionHash ? region : (_b = (_a = partitionHash[partition]) === null || _a === void 0 ? void 0 : _a.endpoint) !== null && _b !== void 0 ? _b : region;
    const hostnameOptions = { useFipsEndpoint, useDualstackEndpoint };
    const regionHostname = (0, getHostnameFromVariants_1.getHostnameFromVariants)((_c = regionHash[resolvedRegion]) === null || _c === void 0 ? void 0 : _c.variants, hostnameOptions);
    const partitionHostname = (0, getHostnameFromVariants_1.getHostnameFromVariants)((_d = partitionHash[partition]) === null || _d === void 0 ? void 0 : _d.variants, hostnameOptions);
    const hostname = (0, getResolvedHostname_1.getResolvedHostname)(resolvedRegion, { regionHostname, partitionHostname });
    if (hostname === undefined) {
        throw new Error(`Endpoint resolution failed for: ${{ resolvedRegion, useFipsEndpoint, useDualstackEndpoint }}`);
    }
    const signingRegion = (0, getResolvedSigningRegion_1.getResolvedSigningRegion)(hostname, {
        signingRegion: (_e = regionHash[resolvedRegion]) === null || _e === void 0 ? void 0 : _e.signingRegion,
        regionRegex: partitionHash[partition].regionRegex,
        useFipsEndpoint,
    });
    return {
        partition,
        signingService,
        hostname,
        ...(signingRegion && { signingRegion }),
        ...(((_f = regionHash[resolvedRegion]) === null || _f === void 0 ? void 0 : _f.signingService) && {
            signingService: regionHash[resolvedRegion].signingService,
        }),
    };
};
exports.getRegionInfo = getRegionInfo;
