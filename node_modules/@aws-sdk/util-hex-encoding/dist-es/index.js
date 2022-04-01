var SHORT_TO_HEX = {};
var HEX_TO_SHORT = {};
for (var i = 0; i < 256; i++) {
    var encodedByte = i.toString(16).toLowerCase();
    if (encodedByte.length === 1) {
        encodedByte = "0".concat(encodedByte);
    }
    SHORT_TO_HEX[i] = encodedByte;
    HEX_TO_SHORT[encodedByte] = i;
}
export function fromHex(encoded) {
    if (encoded.length % 2 !== 0) {
        throw new Error("Hex encoded strings must have an even number length");
    }
    var out = new Uint8Array(encoded.length / 2);
    for (var i = 0; i < encoded.length; i += 2) {
        var encodedByte = encoded.slice(i, i + 2).toLowerCase();
        if (encodedByte in HEX_TO_SHORT) {
            out[i / 2] = HEX_TO_SHORT[encodedByte];
        }
        else {
            throw new Error("Cannot decode unrecognized sequence ".concat(encodedByte, " as hexadecimal"));
        }
    }
    return out;
}
export function toHex(bytes) {
    var out = "";
    for (var i = 0; i < bytes.byteLength; i++) {
        out += SHORT_TO_HEX[bytes[i]];
    }
    return out;
}
