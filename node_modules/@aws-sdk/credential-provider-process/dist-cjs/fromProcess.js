"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromProcess = void 0;
const shared_ini_file_loader_1 = require("@aws-sdk/shared-ini-file-loader");
const resolveProcessCredentials_1 = require("./resolveProcessCredentials");
const fromProcess = (init = {}) => async () => {
    const profiles = await (0, shared_ini_file_loader_1.parseKnownFiles)(init);
    return (0, resolveProcessCredentials_1.resolveProcessCredentials)((0, shared_ini_file_loader_1.getProfileName)(init), profiles);
};
exports.fromProcess = fromProcess;
