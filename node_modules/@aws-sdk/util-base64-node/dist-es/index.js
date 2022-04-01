import { fromArrayBuffer, fromString } from "@aws-sdk/util-buffer-from";
var BASE64_REGEX = /^[A-Za-z0-9+/]*={0,2}$/;
export function fromBase64(input) {
    if ((input.length * 3) % 4 !== 0) {
        throw new TypeError("Incorrect padding on base64 string.");
    }
    if (!BASE64_REGEX.exec(input)) {
        throw new TypeError("Invalid base64 string.");
    }
    var buffer = fromString(input, "base64");
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}
export function toBase64(input) {
    return fromArrayBuffer(input.buffer, input.byteOffset, input.byteLength).toString("base64");
}
