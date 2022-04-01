import { __awaiter, __generator } from "tslib";
import { fromBase64 } from "@aws-sdk/util-base64-browser";
export var streamCollector = function (stream) {
    if (typeof Blob === "function" && stream instanceof Blob) {
        return collectBlob(stream);
    }
    return collectStream(stream);
};
function collectBlob(blob) {
    return __awaiter(this, void 0, void 0, function () {
        var base64, arrayBuffer;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, readToBase64(blob)];
                case 1:
                    base64 = _a.sent();
                    arrayBuffer = fromBase64(base64);
                    return [2, new Uint8Array(arrayBuffer)];
            }
        });
    });
}
function collectStream(stream) {
    return __awaiter(this, void 0, void 0, function () {
        var res, reader, isDone, _a, done, value, prior;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    res = new Uint8Array(0);
                    reader = stream.getReader();
                    isDone = false;
                    _b.label = 1;
                case 1:
                    if (!!isDone) return [3, 3];
                    return [4, reader.read()];
                case 2:
                    _a = _b.sent(), done = _a.done, value = _a.value;
                    if (value) {
                        prior = res;
                        res = new Uint8Array(prior.length + value.length);
                        res.set(prior);
                        res.set(value, prior.length);
                    }
                    isDone = done;
                    return [3, 1];
                case 3: return [2, res];
            }
        });
    });
}
function readToBase64(blob) {
    return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onloadend = function () {
            var _a;
            if (reader.readyState !== 2) {
                return reject(new Error("Reader aborted too early"));
            }
            var result = ((_a = reader.result) !== null && _a !== void 0 ? _a : "");
            var commaIndex = result.indexOf(",");
            var dataOffset = commaIndex > -1 ? commaIndex + 1 : result.length;
            resolve(result.substring(dataOffset));
        };
        reader.onabort = function () { return reject(new Error("Read aborted")); };
        reader.onerror = function () { return reject(reader.error); };
        reader.readAsDataURL(blob);
    });
}
