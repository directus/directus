"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHomeDir = void 0;
const os_1 = require("os");
const path_1 = require("path");
const getHomeDir = () => {
    const { HOME, USERPROFILE, HOMEPATH, HOMEDRIVE = `C:${path_1.sep}` } = process.env;
    if (HOME)
        return HOME;
    if (USERPROFILE)
        return USERPROFILE;
    if (HOMEPATH)
        return `${HOMEDRIVE}${HOMEPATH}`;
    return (0, os_1.homedir)();
};
exports.getHomeDir = getHomeDir;
