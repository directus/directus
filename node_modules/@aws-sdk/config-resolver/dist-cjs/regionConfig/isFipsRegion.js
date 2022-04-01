"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFipsRegion = void 0;
const isFipsRegion = (region) => typeof region === "string" && (region.startsWith("fips-") || region.endsWith("-fips"));
exports.isFipsRegion = isFipsRegion;
