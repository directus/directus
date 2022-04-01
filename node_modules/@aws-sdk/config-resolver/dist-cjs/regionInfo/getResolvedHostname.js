"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResolvedHostname = void 0;
const getResolvedHostname = (resolvedRegion, { regionHostname, partitionHostname }) => regionHostname
    ? regionHostname
    : partitionHostname
        ? partitionHostname.replace("{region}", resolvedRegion)
        : undefined;
exports.getResolvedHostname = getResolvedHostname;
