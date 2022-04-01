import { isFipsRegion } from "./isFipsRegion";
export var getRealRegion = function (region) {
    return isFipsRegion(region)
        ? ["fips-aws-global", "aws-fips"].includes(region)
            ? "us-east-1"
            : region.replace(/fips-(dkr-|prod-)?|-fips/, "")
        : region;
};
