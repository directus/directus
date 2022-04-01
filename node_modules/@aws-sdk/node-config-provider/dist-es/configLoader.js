import { chain, memoize } from "@aws-sdk/property-provider";
import { fromEnv } from "./fromEnv";
import { fromSharedConfigFiles } from "./fromSharedConfigFiles";
import { fromStatic } from "./fromStatic";
export var loadConfig = function (_a, configuration) {
    var environmentVariableSelector = _a.environmentVariableSelector, configFileSelector = _a.configFileSelector, defaultValue = _a.default;
    if (configuration === void 0) { configuration = {}; }
    return memoize(chain(fromEnv(environmentVariableSelector), fromSharedConfigFiles(configFileSelector, configuration), fromStatic(defaultValue)));
};
