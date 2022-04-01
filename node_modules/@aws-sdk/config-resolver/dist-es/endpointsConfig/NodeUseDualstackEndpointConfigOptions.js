import { booleanSelector, SelectorType } from "@aws-sdk/util-config-provider";
export var ENV_USE_DUALSTACK_ENDPOINT = "AWS_USE_DUALSTACK_ENDPOINT";
export var CONFIG_USE_DUALSTACK_ENDPOINT = "use_dualstack_endpoint";
export var DEFAULT_USE_DUALSTACK_ENDPOINT = false;
export var NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS = {
    environmentVariableSelector: function (env) {
        return booleanSelector(env, ENV_USE_DUALSTACK_ENDPOINT, SelectorType.ENV);
    },
    configFileSelector: function (profile) { return booleanSelector(profile, CONFIG_USE_DUALSTACK_ENDPOINT, SelectorType.CONFIG); },
    default: false,
};
