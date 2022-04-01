"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENDPOINT_MODE_CONFIG_OPTIONS = exports.CONFIG_ENDPOINT_MODE_NAME = exports.ENV_ENDPOINT_MODE_NAME = void 0;
const EndpointMode_1 = require("./EndpointMode");
exports.ENV_ENDPOINT_MODE_NAME = "AWS_EC2_METADATA_SERVICE_ENDPOINT_MODE";
exports.CONFIG_ENDPOINT_MODE_NAME = "ec2_metadata_service_endpoint_mode";
exports.ENDPOINT_MODE_CONFIG_OPTIONS = {
    environmentVariableSelector: (env) => env[exports.ENV_ENDPOINT_MODE_NAME],
    configFileSelector: (profile) => profile[exports.CONFIG_ENDPOINT_MODE_NAME],
    default: EndpointMode_1.EndpointMode.IPv4,
};
