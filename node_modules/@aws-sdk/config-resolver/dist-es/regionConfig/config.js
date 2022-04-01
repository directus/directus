export var REGION_ENV_NAME = "AWS_REGION";
export var REGION_INI_NAME = "region";
export var NODE_REGION_CONFIG_OPTIONS = {
    environmentVariableSelector: function (env) { return env[REGION_ENV_NAME]; },
    configFileSelector: function (profile) { return profile[REGION_INI_NAME]; },
    default: function () {
        throw new Error("Region is missing");
    },
};
export var NODE_REGION_CONFIG_FILE_OPTIONS = {
    preferredFile: "credentials",
};
