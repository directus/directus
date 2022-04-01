"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hash = void 0;
const util_buffer_from_1 = require("@aws-sdk/util-buffer-from");
const buffer_1 = require("buffer");
const crypto_1 = require("crypto");
class Hash {
    constructor(algorithmIdentifier, secret) {
        this.hash = secret ? (0, crypto_1.createHmac)(algorithmIdentifier, castSourceData(secret)) : (0, crypto_1.createHash)(algorithmIdentifier);
    }
    update(toHash, encoding) {
        this.hash.update(castSourceData(toHash, encoding));
    }
    digest() {
        return Promise.resolve(this.hash.digest());
    }
}
exports.Hash = Hash;
function castSourceData(toCast, encoding) {
    if (buffer_1.Buffer.isBuffer(toCast)) {
        return toCast;
    }
    if (typeof toCast === "string") {
        return (0, util_buffer_from_1.fromString)(toCast, encoding);
    }
    if (ArrayBuffer.isView(toCast)) {
        return (0, util_buffer_from_1.fromArrayBuffer)(toCast.buffer, toCast.byteOffset, toCast.byteLength);
    }
    return (0, util_buffer_from_1.fromArrayBuffer)(toCast);
}
