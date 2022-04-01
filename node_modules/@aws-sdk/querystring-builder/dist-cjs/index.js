"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildQueryString = void 0;
const util_uri_escape_1 = require("@aws-sdk/util-uri-escape");
function buildQueryString(query) {
    const parts = [];
    for (let key of Object.keys(query).sort()) {
        const value = query[key];
        key = (0, util_uri_escape_1.escapeUri)(key);
        if (Array.isArray(value)) {
            for (let i = 0, iLen = value.length; i < iLen; i++) {
                parts.push(`${key}=${(0, util_uri_escape_1.escapeUri)(value[i])}`);
            }
        }
        else {
            let qsEntry = key;
            if (value || typeof value === "string") {
                qsEntry += `=${(0, util_uri_escape_1.escapeUri)(value)}`;
            }
            parts.push(qsEntry);
        }
    }
    return parts.join("&");
}
exports.buildQueryString = buildQueryString;
