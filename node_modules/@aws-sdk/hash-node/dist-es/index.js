import { fromArrayBuffer, fromString } from "@aws-sdk/util-buffer-from";
import { Buffer } from "buffer";
import { createHash, createHmac } from "crypto";
var Hash = (function () {
    function Hash(algorithmIdentifier, secret) {
        this.hash = secret ? createHmac(algorithmIdentifier, castSourceData(secret)) : createHash(algorithmIdentifier);
    }
    Hash.prototype.update = function (toHash, encoding) {
        this.hash.update(castSourceData(toHash, encoding));
    };
    Hash.prototype.digest = function () {
        return Promise.resolve(this.hash.digest());
    };
    return Hash;
}());
export { Hash };
function castSourceData(toCast, encoding) {
    if (Buffer.isBuffer(toCast)) {
        return toCast;
    }
    if (typeof toCast === "string") {
        return fromString(toCast, encoding);
    }
    if (ArrayBuffer.isView(toCast)) {
        return fromArrayBuffer(toCast.buffer, toCast.byteOffset, toCast.byteLength);
    }
    return fromArrayBuffer(toCast);
}
