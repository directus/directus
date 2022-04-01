"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPayloadHash = void 0;
const is_array_buffer_1 = require("@aws-sdk/is-array-buffer");
const util_hex_encoding_1 = require("@aws-sdk/util-hex-encoding");
const constants_1 = require("./constants");
const getPayloadHash = async ({ headers, body }, hashConstructor) => {
    for (const headerName of Object.keys(headers)) {
        if (headerName.toLowerCase() === constants_1.SHA256_HEADER) {
            return headers[headerName];
        }
    }
    if (body == undefined) {
        return "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    }
    else if (typeof body === "string" || ArrayBuffer.isView(body) || (0, is_array_buffer_1.isArrayBuffer)(body)) {
        const hashCtor = new hashConstructor();
        hashCtor.update(body);
        return (0, util_hex_encoding_1.toHex)(await hashCtor.digest());
    }
    return constants_1.UNSIGNED_PAYLOAD;
};
exports.getPayloadHash = getPayloadHash;
