import { __values } from "tslib";
import { escapeUri } from "@aws-sdk/util-uri-escape";
import { SIGNATURE_HEADER } from "./constants";
export var getCanonicalQuery = function (_a) {
    var e_1, _b;
    var _c = _a.query, query = _c === void 0 ? {} : _c;
    var keys = [];
    var serialized = {};
    var _loop_1 = function (key) {
        if (key.toLowerCase() === SIGNATURE_HEADER) {
            return "continue";
        }
        keys.push(key);
        var value = query[key];
        if (typeof value === "string") {
            serialized[key] = "".concat(escapeUri(key), "=").concat(escapeUri(value));
        }
        else if (Array.isArray(value)) {
            serialized[key] = value
                .slice(0)
                .sort()
                .reduce(function (encoded, value) { return encoded.concat(["".concat(escapeUri(key), "=").concat(escapeUri(value))]); }, [])
                .join("&");
        }
    };
    try {
        for (var _d = __values(Object.keys(query).sort()), _e = _d.next(); !_e.done; _e = _d.next()) {
            var key = _e.value;
            _loop_1(key);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_e && !_e.done && (_b = _d.return)) _b.call(_d);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return keys
        .map(function (key) { return serialized[key]; })
        .filter(function (serialized) { return serialized; })
        .join("&");
};
