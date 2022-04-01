"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromIni = void 0;
const shared_ini_file_loader_1 = require("@aws-sdk/shared-ini-file-loader");
const resolveProfileData_1 = require("./resolveProfileData");
const fromIni = (init = {}) => async () => {
    const profiles = await (0, shared_ini_file_loader_1.parseKnownFiles)(init);
    return (0, resolveProfileData_1.resolveProfileData)((0, shared_ini_file_loader_1.getProfileName)(init), profiles, init);
};
exports.fromIni = fromIni;
