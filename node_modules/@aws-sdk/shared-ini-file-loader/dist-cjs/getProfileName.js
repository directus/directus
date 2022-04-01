"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfileName = exports.DEFAULT_PROFILE = exports.ENV_PROFILE = void 0;
exports.ENV_PROFILE = "AWS_PROFILE";
exports.DEFAULT_PROFILE = "default";
const getProfileName = (init) => init.profile || process.env[exports.ENV_PROFILE] || exports.DEFAULT_PROFILE;
exports.getProfileName = getProfileName;
