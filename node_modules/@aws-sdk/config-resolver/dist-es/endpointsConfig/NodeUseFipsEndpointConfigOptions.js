import { booleanSelector, SelectorType } from "@aws-sdk/util-config-provider";
export var ENV_USE_FIPS_ENDPOINT = "AWS_USE_FIPS_ENDPOINT";
export var CONFIG_USE_FIPS_ENDPOINT = "use_fips_endpoint";
export var DEFAULT_USE_FIPS_ENDPOINT = false;
export var NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS = {
    environmentVariableSelector: function (env) {
        return booleanSelector(env, ENV_USE_FIPS_ENDPOINT, SelectorType.ENV);
    },
    configFileSelector: function (profile) { return booleanSelector(profile, CONFIG_USE_FIPS_ENDPOINT, SelectorType.CONFIG); },
    default: false,
};
