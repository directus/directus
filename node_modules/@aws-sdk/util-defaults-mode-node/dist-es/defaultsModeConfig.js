var AWS_DEFAULTS_MODE_ENV = "AWS_DEFAULTS_MODE";
var AWS_DEFAULTS_MODE_CONFIG = "defaults_mode";
export var NODE_DEFAULTS_MODE_CONFIG_OPTIONS = {
    environmentVariableSelector: function (env) {
        return env[AWS_DEFAULTS_MODE_ENV];
    },
    configFileSelector: function (profile) {
        return profile[AWS_DEFAULTS_MODE_CONFIG];
    },
    default: "legacy",
};
