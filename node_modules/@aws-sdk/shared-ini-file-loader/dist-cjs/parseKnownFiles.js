"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseKnownFiles = void 0;
const loadSharedConfigFiles_1 = require("./loadSharedConfigFiles");
const parseKnownFiles = async (init) => {
    const parsedFiles = await (0, loadSharedConfigFiles_1.loadSharedConfigFiles)(init);
    return {
        ...parsedFiles.configFile,
        ...parsedFiles.credentialsFile,
    };
};
exports.parseKnownFiles = parseKnownFiles;
