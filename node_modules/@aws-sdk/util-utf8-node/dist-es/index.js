import { fromArrayBuffer, fromString } from "@aws-sdk/util-buffer-from";
export var fromUtf8 = function (input) {
    var buf = fromString(input, "utf8");
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength / Uint8Array.BYTES_PER_ELEMENT);
};
export var toUtf8 = function (input) {
    return fromArrayBuffer(input.buffer, input.byteOffset, input.byteLength).toString("utf8");
};
