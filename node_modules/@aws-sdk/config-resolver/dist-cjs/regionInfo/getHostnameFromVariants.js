"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHostnameFromVariants = void 0;
const getHostnameFromVariants = (variants = [], { useFipsEndpoint, useDualstackEndpoint }) => {
    var _a;
    return (_a = variants.find(({ tags }) => useFipsEndpoint === tags.includes("fips") && useDualstackEndpoint === tags.includes("dualstack"))) === null || _a === void 0 ? void 0 : _a.hostname;
};
exports.getHostnameFromVariants = getHostnameFromVariants;
