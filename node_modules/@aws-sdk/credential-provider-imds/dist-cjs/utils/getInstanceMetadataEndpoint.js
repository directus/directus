"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInstanceMetadataEndpoint = void 0;
const node_config_provider_1 = require("@aws-sdk/node-config-provider");
const url_parser_1 = require("@aws-sdk/url-parser");
const Endpoint_1 = require("../config/Endpoint");
const EndpointConfigOptions_1 = require("../config/EndpointConfigOptions");
const EndpointMode_1 = require("../config/EndpointMode");
const EndpointModeConfigOptions_1 = require("../config/EndpointModeConfigOptions");
const getInstanceMetadataEndpoint = async () => (0, url_parser_1.parseUrl)((await getFromEndpointConfig()) || (await getFromEndpointModeConfig()));
exports.getInstanceMetadataEndpoint = getInstanceMetadataEndpoint;
const getFromEndpointConfig = async () => (0, node_config_provider_1.loadConfig)(EndpointConfigOptions_1.ENDPOINT_CONFIG_OPTIONS)();
const getFromEndpointModeConfig = async () => {
    const endpointMode = await (0, node_config_provider_1.loadConfig)(EndpointModeConfigOptions_1.ENDPOINT_MODE_CONFIG_OPTIONS)();
    switch (endpointMode) {
        case EndpointMode_1.EndpointMode.IPv4:
            return Endpoint_1.Endpoint.IPv4;
        case EndpointMode_1.EndpointMode.IPv6:
            return Endpoint_1.Endpoint.IPv6;
        default:
            throw new Error(`Unsupported endpoint mode: ${endpointMode}.` + ` Select from ${Object.values(EndpointMode_1.EndpointMode)}`);
    }
};
