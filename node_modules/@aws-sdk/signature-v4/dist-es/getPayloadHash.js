import { __awaiter, __generator, __values } from "tslib";
import { isArrayBuffer } from "@aws-sdk/is-array-buffer";
import { toHex } from "@aws-sdk/util-hex-encoding";
import { SHA256_HEADER, UNSIGNED_PAYLOAD } from "./constants";
export var getPayloadHash = function (_a, hashConstructor) {
    var headers = _a.headers, body = _a.body;
    return __awaiter(void 0, void 0, void 0, function () {
        var _b, _c, headerName, hashCtor, _d;
        var e_1, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    try {
                        for (_b = __values(Object.keys(headers)), _c = _b.next(); !_c.done; _c = _b.next()) {
                            headerName = _c.value;
                            if (headerName.toLowerCase() === SHA256_HEADER) {
                                return [2, headers[headerName]];
                            }
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (_c && !_c.done && (_e = _b.return)) _e.call(_b);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    if (!(body == undefined)) return [3, 1];
                    return [2, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"];
                case 1:
                    if (!(typeof body === "string" || ArrayBuffer.isView(body) || isArrayBuffer(body))) return [3, 3];
                    hashCtor = new hashConstructor();
                    hashCtor.update(body);
                    _d = toHex;
                    return [4, hashCtor.digest()];
                case 2: return [2, _d.apply(void 0, [_f.sent()])];
                case 3: return [2, UNSIGNED_PAYLOAD];
            }
        });
    });
};
