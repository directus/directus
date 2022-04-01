"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toBase64 = exports.fromBase64 = void 0;
const alphabetByEncoding = {};
const alphabetByValue = new Array(64);
for (let i = 0, start = "A".charCodeAt(0), limit = "Z".charCodeAt(0); i + start <= limit; i++) {
    const char = String.fromCharCode(i + start);
    alphabetByEncoding[char] = i;
    alphabetByValue[i] = char;
}
for (let i = 0, start = "a".charCodeAt(0), limit = "z".charCodeAt(0); i + start <= limit; i++) {
    const char = String.fromCharCode(i + start);
    const index = i + 26;
    alphabetByEncoding[char] = index;
    alphabetByValue[index] = char;
}
for (let i = 0; i < 10; i++) {
    alphabetByEncoding[i.toString(10)] = i + 52;
    const char = i.toString(10);
    const index = i + 52;
    alphabetByEncoding[char] = index;
    alphabetByValue[index] = char;
}
alphabetByEncoding["+"] = 62;
alphabetByValue[62] = "+";
alphabetByEncoding["/"] = 63;
alphabetByValue[63] = "/";
const bitsPerLetter = 6;
const bitsPerByte = 8;
const maxLetterValue = 0b111111;
function fromBase64(input) {
    let totalByteLength = (input.length / 4) * 3;
    if (input.slice(-2) === "==") {
        totalByteLength -= 2;
    }
    else if (input.slice(-1) === "=") {
        totalByteLength--;
    }
    const out = new ArrayBuffer(totalByteLength);
    const dataView = new DataView(out);
    for (let i = 0; i < input.length; i += 4) {
        let bits = 0;
        let bitLength = 0;
        for (let j = i, limit = i + 3; j <= limit; j++) {
            if (input[j] !== "=") {
                if (!(input[j] in alphabetByEncoding)) {
                    throw new TypeError(`Invalid character ${input[j]} in base64 string.`);
                }
                bits |= alphabetByEncoding[input[j]] << ((limit - j) * bitsPerLetter);
                bitLength += bitsPerLetter;
            }
            else {
                bits >>= bitsPerLetter;
            }
        }
        const chunkOffset = (i / 4) * 3;
        bits >>= bitLength % bitsPerByte;
        const byteLength = Math.floor(bitLength / bitsPerByte);
        for (let k = 0; k < byteLength; k++) {
            const offset = (byteLength - k - 1) * bitsPerByte;
            dataView.setUint8(chunkOffset + k, (bits & (255 << offset)) >> offset);
        }
    }
    return new Uint8Array(out);
}
exports.fromBase64 = fromBase64;
function toBase64(input) {
    let str = "";
    for (let i = 0; i < input.length; i += 3) {
        let bits = 0;
        let bitLength = 0;
        for (let j = i, limit = Math.min(i + 3, input.length); j < limit; j++) {
            bits |= input[j] << ((limit - j - 1) * bitsPerByte);
            bitLength += bitsPerByte;
        }
        const bitClusterCount = Math.ceil(bitLength / bitsPerLetter);
        bits <<= bitClusterCount * bitsPerLetter - bitLength;
        for (let k = 1; k <= bitClusterCount; k++) {
            const offset = (bitClusterCount - k) * bitsPerLetter;
            str += alphabetByValue[(bits & (maxLetterValue << offset)) >> offset];
        }
        str += "==".slice(0, 4 - bitClusterCount);
    }
    return str;
}
exports.toBase64 = toBase64;
