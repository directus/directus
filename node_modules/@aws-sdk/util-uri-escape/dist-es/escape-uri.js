export var escapeUri = function (uri) {
    return encodeURIComponent(uri).replace(/[!'()*]/g, hexEncode);
};
var hexEncode = function (c) { return "%".concat(c.charCodeAt(0).toString(16).toUpperCase()); };
