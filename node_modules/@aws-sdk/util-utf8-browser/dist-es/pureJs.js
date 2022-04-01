export var fromUtf8 = function (input) {
    var bytes = [];
    for (var i = 0, len = input.length; i < len; i++) {
        var value = input.charCodeAt(i);
        if (value < 0x80) {
            bytes.push(value);
        }
        else if (value < 0x800) {
            bytes.push((value >> 6) | 192, (value & 63) | 128);
        }
        else if (i + 1 < input.length && (value & 0xfc00) === 0xd800 && (input.charCodeAt(i + 1) & 0xfc00) === 0xdc00) {
            var surrogatePair = 0x10000 + ((value & 1023) << 10) + (input.charCodeAt(++i) & 1023);
            bytes.push((surrogatePair >> 18) | 240, ((surrogatePair >> 12) & 63) | 128, ((surrogatePair >> 6) & 63) | 128, (surrogatePair & 63) | 128);
        }
        else {
            bytes.push((value >> 12) | 224, ((value >> 6) & 63) | 128, (value & 63) | 128);
        }
    }
    return Uint8Array.from(bytes);
};
export var toUtf8 = function (input) {
    var decoded = "";
    for (var i = 0, len = input.length; i < len; i++) {
        var byte = input[i];
        if (byte < 0x80) {
            decoded += String.fromCharCode(byte);
        }
        else if (192 <= byte && byte < 224) {
            var nextByte = input[++i];
            decoded += String.fromCharCode(((byte & 31) << 6) | (nextByte & 63));
        }
        else if (240 <= byte && byte < 365) {
            var surrogatePair = [byte, input[++i], input[++i], input[++i]];
            var encoded = "%" + surrogatePair.map(function (byteValue) { return byteValue.toString(16); }).join("%");
            decoded += decodeURIComponent(encoded);
        }
        else {
            decoded += String.fromCharCode(((byte & 15) << 12) | ((input[++i] & 63) << 6) | (input[++i] & 63));
        }
    }
    return decoded;
};
