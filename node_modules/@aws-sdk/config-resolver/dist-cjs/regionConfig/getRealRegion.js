"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRealRegion = void 0;
const isFipsRegion_1 = require("./isFipsRegion");
const getRealRegion = (region) => (0, isFipsRegion_1.isFipsRegion)(region)
    ? ["fips-aws-global", "aws-fips"].includes(region)
        ? "us-east-1"
        : region.replace(/fips-(dkr-|prod-)?|-fips/, "")
    : region;
exports.getRealRegion = getRealRegion;
