// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * Encodes a string in base64 format.
 * @param value - the string to encode
 */
export function encodeString(value) {
    return btoa(value);
}
/**
 * Encodes a byte array in base64 format.
 * @param value - the Uint8Aray to encode
 */
export function encodeByteArray(value) {
    let str = "";
    for (let i = 0; i < value.length; i++) {
        str += String.fromCharCode(value[i]);
    }
    return btoa(str);
}
/**
 * Decodes a base64 string into a byte array.
 * @param value - the base64 string to decode
 */
export function decodeString(value) {
    const byteString = atob(value);
    const arr = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
        arr[i] = byteString.charCodeAt(i);
    }
    return arr;
}
/**
 * Decodes a base64 string into a string.
 * @param value - the base64 string to decode
 */
export function decodeStringToString(value) {
    return atob(value);
}
//# sourceMappingURL=base64.browser.js.map