import { __values } from "tslib";
export var hasHeader = function (soughtHeader, headers) {
    var e_1, _a;
    soughtHeader = soughtHeader.toLowerCase();
    try {
        for (var _b = __values(Object.keys(headers)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var headerName = _c.value;
            if (soughtHeader === headerName.toLowerCase()) {
                return true;
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return false;
};
export var getHeaderValue = function (soughtHeader, headers) {
    var e_2, _a;
    soughtHeader = soughtHeader.toLowerCase();
    try {
        for (var _b = __values(Object.keys(headers)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var headerName = _c.value;
            if (soughtHeader === headerName.toLowerCase()) {
                return headers[headerName];
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_2) throw e_2.error; }
    }
    return undefined;
};
export var deleteHeader = function (soughtHeader, headers) {
    var e_3, _a;
    soughtHeader = soughtHeader.toLowerCase();
    try {
        for (var _b = __values(Object.keys(headers)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var headerName = _c.value;
            if (soughtHeader === headerName.toLowerCase()) {
                delete headers[headerName];
            }
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_3) throw e_3.error; }
    }
};
