var alphabetByEncoding = {};
var alphabetByValue = new Array(64);
for (var i = 0, start = "A".charCodeAt(0), limit = "Z".charCodeAt(0); i + start <= limit; i++) {
    var char = String.fromCharCode(i + start);
    alphabetByEncoding[char] = i;
    alphabetByValue[i] = char;
}
for (var i = 0, start = "a".charCodeAt(0), limit = "z".charCodeAt(0); i + start <= limit; i++) {
    var char = String.fromCharCode(i + start);
    var index = i + 26;
    alphabetByEncoding[char] = index;
    alphabetByValue[index] = char;
}
for (var i = 0; i < 10; i++) {
    alphabetByEncoding[i.toString(10)] = i + 52;
    var char = i.toString(10);
    var index = i + 52;
    alphabetByEncoding[char] = index;
    alphabetByValue[index] = char;
}
alphabetByEncoding["+"] = 62;
alphabetByValue[62] = "+";
alphabetByEncoding["/"] = 63;
alphabetByValue[63] = "/";
var bitsPerLetter = 6;
var bitsPerByte = 8;
var maxLetterValue = 63;
export function fromBase64(input) {
    var totalByteLength = (input.length / 4) * 3;
    if (input.slice(-2) === "==") {
        totalByteLength -= 2;
    }
    else if (input.slice(-1) === "=") {
        totalByteLength--;
    }
    var out = new ArrayBuffer(totalByteLength);
    var dataView = new DataView(out);
    for (var i = 0; i < input.length; i += 4) {
        var bits = 0;
        var bitLength = 0;
        for (var j = i, limit = i + 3; j <= limit; j++) {
            if (input[j] !== "=") {
                if (!(input[j] in alphabetByEncoding)) {
                    throw new TypeError("Invalid character ".concat(input[j], " in base64 string."));
                }
                bits |= alphabetByEncoding[input[j]] << ((limit - j) * bitsPerLetter);
                bitLength += bitsPerLetter;
            }
            else {
                bits >>= bitsPerLetter;
            }
        }
        var chunkOffset = (i / 4) * 3;
        bits >>= bitLength % bitsPerByte;
        var byteLength = Math.floor(bitLength / bitsPerByte);
        for (var k = 0; k < byteLength; k++) {
            var offset = (byteLength - k - 1) * bitsPerByte;
            dataView.setUint8(chunkOffset + k, (bits & (255 << offset)) >> offset);
        }
    }
    return new Uint8Array(out);
}
export function toBase64(input) {
    var str = "";
    for (var i = 0; i < input.length; i += 3) {
        var bits = 0;
        var bitLength = 0;
        for (var j = i, limit = Math.min(i + 3, input.length); j < limit; j++) {
            bits |= input[j] << ((limit - j - 1) * bitsPerByte);
            bitLength += bitsPerByte;
        }
        var bitClusterCount = Math.ceil(bitLength / bitsPerLetter);
        bits <<= bitClusterCount * bitsPerLetter - bitLength;
        for (var k = 1; k <= bitClusterCount; k++) {
            var offset = (bitClusterCount - k) * bitsPerLetter;
            str += alphabetByValue[(bits & (maxLetterValue << offset)) >> offset];
        }
        str += "==".slice(0, 4 - bitClusterCount);
    }
    return str;
}
