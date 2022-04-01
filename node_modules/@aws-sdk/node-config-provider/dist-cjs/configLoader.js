"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = void 0;
const property_provider_1 = require("@aws-sdk/property-provider");
const fromEnv_1 = require("./fromEnv");
const fromSharedConfigFiles_1 = require("./fromSharedConfigFiles");
const fromStatic_1 = require("./fromStatic");
const loadConfig = ({ environmentVariableSelector, configFileSelector, default: defaultValue }, configuration = {}) => (0, property_provider_1.memoize)((0, property_provider_1.chain)((0, fromEnv_1.fromEnv)(environmentVariableSelector), (0, fromSharedConfigFiles_1.fromSharedConfigFiles)(configFileSelector, configuration), (0, fromStatic_1.fromStatic)(defaultValue)));
exports.loadConfig = loadConfig;
