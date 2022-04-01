import { escapeUri } from "./escape-uri";
export var escapeUriPath = function (uri) { return uri.split("/").map(escapeUri).join("/"); };
