import { createHash } from "crypto";
import { join } from "path";
import { getHomeDir } from "./getHomeDir";
export var getSSOTokenFilepath = function (ssoStartUrl) {
    var hasher = createHash("sha1");
    var cacheName = hasher.update(ssoStartUrl).digest("hex");
    return join(getHomeDir(), ".aws", "sso", "cache", "".concat(cacheName, ".json"));
};
