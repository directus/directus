"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromImdsCredentials = exports.isImdsCredentials = void 0;
const isImdsCredentials = (arg) => Boolean(arg) &&
    typeof arg === "object" &&
    typeof arg.AccessKeyId === "string" &&
    typeof arg.SecretAccessKey === "string" &&
    typeof arg.Token === "string" &&
    typeof arg.Expiration === "string";
exports.isImdsCredentials = isImdsCredentials;
const fromImdsCredentials = (creds) => ({
    accessKeyId: creds.AccessKeyId,
    secretAccessKey: creds.SecretAccessKey,
    sessionToken: creds.Token,
    expiration: new Date(creds.Expiration),
});
exports.fromImdsCredentials = fromImdsCredentials;
