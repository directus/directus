export var ENV_ENDPOINT_NAME = "AWS_EC2_METADATA_SERVICE_ENDPOINT";
export var CONFIG_ENDPOINT_NAME = "ec2_metadata_service_endpoint";
export var ENDPOINT_CONFIG_OPTIONS = {
    environmentVariableSelector: function (env) { return env[ENV_ENDPOINT_NAME]; },
    configFileSelector: function (profile) { return profile[CONFIG_ENDPOINT_NAME]; },
    default: undefined,
};
