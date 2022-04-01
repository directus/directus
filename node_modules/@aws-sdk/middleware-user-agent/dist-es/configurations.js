import { __assign } from "tslib";
export function resolveUserAgentConfig(input) {
    return __assign(__assign({}, input), { customUserAgent: typeof input.customUserAgent === "string" ? [[input.customUserAgent]] : input.customUserAgent });
}
