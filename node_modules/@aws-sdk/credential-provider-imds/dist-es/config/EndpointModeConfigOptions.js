import { EndpointMode } from "./EndpointMode";
export var ENV_ENDPOINT_MODE_NAME = "AWS_EC2_METADATA_SERVICE_ENDPOINT_MODE";
export var CONFIG_ENDPOINT_MODE_NAME = "ec2_metadata_service_endpoint_mode";
export var ENDPOINT_MODE_CONFIG_OPTIONS = {
    environmentVariableSelector: function (env) { return env[ENV_ENDPOINT_MODE_NAME]; },
    configFileSelector: function (profile) { return profile[CONFIG_ENDPOINT_MODE_NAME]; },
    default: EndpointMode.IPv4,
};
