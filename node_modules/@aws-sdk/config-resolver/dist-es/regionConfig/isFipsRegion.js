export var isFipsRegion = function (region) {
    return typeof region === "string" && (region.startsWith("fips-") || region.endsWith("-fips"));
};
