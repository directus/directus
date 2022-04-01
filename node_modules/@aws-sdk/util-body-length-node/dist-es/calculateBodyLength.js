import { fstatSync, lstatSync } from "fs";
export var calculateBodyLength = function (body) {
    if (!body) {
        return 0;
    }
    if (typeof body === "string") {
        return Buffer.from(body).length;
    }
    else if (typeof body.byteLength === "number") {
        return body.byteLength;
    }
    else if (typeof body.size === "number") {
        return body.size;
    }
    else if (typeof body.path === "string" || Buffer.isBuffer(body.path)) {
        return lstatSync(body.path).size;
    }
    else if (typeof body.fd === "number") {
        return fstatSync(body.fd).size;
    }
    throw new Error("Body Length computation failed for ".concat(body));
};
