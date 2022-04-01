import { isArrayBuffer } from "@aws-sdk/is-array-buffer";
import { Buffer } from "buffer";
export var fromArrayBuffer = function (input, offset, length) {
    if (offset === void 0) { offset = 0; }
    if (length === void 0) { length = input.byteLength - offset; }
    if (!isArrayBuffer(input)) {
        throw new TypeError("The \"input\" argument must be ArrayBuffer. Received type ".concat(typeof input, " (").concat(input, ")"));
    }
    return Buffer.from(input, offset, length);
};
export var fromString = function (input, encoding) {
    if (typeof input !== "string") {
        throw new TypeError("The \"input\" argument must be of type string. Received type ".concat(typeof input, " (").concat(input, ")"));
    }
    return encoding ? Buffer.from(input, encoding) : Buffer.from(input);
};
