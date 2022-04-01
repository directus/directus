"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sha256 = void 0;
var isEmptyData_1 = require("./isEmptyData");
var constants_1 = require("./constants");
var util_utf8_browser_1 = require("@aws-sdk/util-utf8-browser");
var util_locate_window_1 = require("@aws-sdk/util-locate-window");
var Sha256 = /** @class */ (function () {
    function Sha256(secret) {
        if (secret) {
            this.operation = getKeyPromise(secret).then(function (keyData) {
                return (0, util_locate_window_1.locateWindow)().msCrypto.subtle.sign(constants_1.SHA_256_HMAC_ALGO, keyData);
            });
            this.operation.catch(function () { });
        }
        else {
            this.operation = Promise.resolve((0, util_locate_window_1.locateWindow)().msCrypto.subtle.digest("SHA-256"));
        }
    }
    Sha256.prototype.update = function (toHash) {
        var _this = this;
        if ((0, isEmptyData_1.isEmptyData)(toHash)) {
            return;
        }
        this.operation = this.operation.then(function (operation) {
            operation.onerror = function () {
                _this.operation = Promise.reject(new Error("Error encountered updating hash"));
            };
            operation.process(toArrayBufferView(toHash));
            return operation;
        });
        this.operation.catch(function () { });
    };
    Sha256.prototype.digest = function () {
        return this.operation.then(function (operation) {
            return new Promise(function (resolve, reject) {
                operation.onerror = function () {
                    reject(new Error("Error encountered finalizing hash"));
                };
                operation.oncomplete = function () {
                    if (operation.result) {
                        resolve(new Uint8Array(operation.result));
                    }
                    reject(new Error("Error encountered finalizing hash"));
                };
                operation.finish();
            });
        });
    };
    return Sha256;
}());
exports.Sha256 = Sha256;
function getKeyPromise(secret) {
    return new Promise(function (resolve, reject) {
        var keyOperation = (0, util_locate_window_1.locateWindow)().msCrypto.subtle.importKey("raw", toArrayBufferView(secret), constants_1.SHA_256_HMAC_ALGO, false, ["sign"]);
        keyOperation.oncomplete = function () {
            if (keyOperation.result) {
                resolve(keyOperation.result);
            }
            reject(new Error("ImportKey completed without importing key."));
        };
        keyOperation.onerror = function () {
            reject(new Error("ImportKey failed to import key."));
        };
    });
}
function toArrayBufferView(data) {
    if (typeof data === "string") {
        return (0, util_utf8_browser_1.fromUtf8)(data);
    }
    if (ArrayBuffer.isView(data)) {
        return new Uint8Array(data.buffer, data.byteOffset, data.byteLength / Uint8Array.BYTES_PER_ELEMENT);
    }
    return new Uint8Array(data);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWUxMVNoYTI1Ni5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9pZTExU2hhMjU2LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZDQUE0QztBQUM1Qyx5Q0FBZ0Q7QUFFaEQsZ0VBQXNEO0FBRXRELGtFQUEyRDtBQUUzRDtJQUdFLGdCQUFZLE1BQW1CO1FBQzdCLElBQUksTUFBTSxFQUFFO1lBQ1YsSUFBSSxDQUFDLFNBQVMsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUEsT0FBTztnQkFDakQsT0FBQyxJQUFBLGlDQUFZLEdBQWUsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FDL0MsNkJBQWlCLEVBQ2pCLE9BQU8sQ0FDUjtZQUhELENBR0MsQ0FDRixDQUFDO1lBQ0YsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsY0FBTyxDQUFDLENBQUMsQ0FBQztTQUNoQzthQUFNO1lBQ0wsSUFBSSxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUM3QixJQUFBLGlDQUFZLEdBQWUsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FDL0QsQ0FBQztTQUNIO0lBQ0gsQ0FBQztJQUVELHVCQUFNLEdBQU4sVUFBTyxNQUFrQjtRQUF6QixpQkFnQkM7UUFmQyxJQUFJLElBQUEseUJBQVcsRUFBQyxNQUFNLENBQUMsRUFBRTtZQUN2QixPQUFPO1NBQ1I7UUFFRCxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQUEsU0FBUztZQUM1QyxTQUFTLENBQUMsT0FBTyxHQUFHO2dCQUNsQixLQUFJLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQzdCLElBQUksS0FBSyxDQUFDLGlDQUFpQyxDQUFDLENBQzdDLENBQUM7WUFDSixDQUFDLENBQUM7WUFDRixTQUFTLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFFN0MsT0FBTyxTQUFTLENBQUM7UUFDbkIsQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxjQUFPLENBQUMsQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFFRCx1QkFBTSxHQUFOO1FBQ0UsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FDeEIsVUFBQSxTQUFTO1lBQ1AsT0FBQSxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNO2dCQUMxQixTQUFTLENBQUMsT0FBTyxHQUFHO29CQUNsQixNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsbUNBQW1DLENBQUMsQ0FBQyxDQUFDO2dCQUN6RCxDQUFDLENBQUM7Z0JBQ0YsU0FBUyxDQUFDLFVBQVUsR0FBRztvQkFDckIsSUFBSSxTQUFTLENBQUMsTUFBTSxFQUFFO3dCQUNwQixPQUFPLENBQUMsSUFBSSxVQUFVLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7cUJBQzNDO29CQUNELE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pELENBQUMsQ0FBQztnQkFFRixTQUFTLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDckIsQ0FBQyxDQUFDO1FBWkYsQ0FZRSxDQUNMLENBQUM7SUFDSixDQUFDO0lBQ0gsYUFBQztBQUFELENBQUMsQUF2REQsSUF1REM7QUF2RFksd0JBQU07QUF5RG5CLFNBQVMsYUFBYSxDQUFDLE1BQWtCO0lBQ3ZDLE9BQU8sSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTTtRQUNqQyxJQUFNLFlBQVksR0FBSSxJQUFBLGlDQUFZLEdBQWUsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FDekUsS0FBSyxFQUNMLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxFQUN6Qiw2QkFBaUIsRUFDakIsS0FBSyxFQUNMLENBQUMsTUFBTSxDQUFDLENBQ1QsQ0FBQztRQUVGLFlBQVksQ0FBQyxVQUFVLEdBQUc7WUFDeEIsSUFBSSxZQUFZLENBQUMsTUFBTSxFQUFFO2dCQUN2QixPQUFPLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQzlCO1lBRUQsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLDRDQUE0QyxDQUFDLENBQUMsQ0FBQztRQUNsRSxDQUFDLENBQUM7UUFDRixZQUFZLENBQUMsT0FBTyxHQUFHO1lBQ3JCLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDLENBQUM7UUFDdkQsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsU0FBUyxpQkFBaUIsQ0FBQyxJQUFnQjtJQUN6QyxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRTtRQUM1QixPQUFPLElBQUEsNEJBQVEsRUFBQyxJQUFJLENBQUMsQ0FBQztLQUN2QjtJQUVELElBQUksV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUM1QixPQUFPLElBQUksVUFBVSxDQUNuQixJQUFJLENBQUMsTUFBTSxFQUNYLElBQUksQ0FBQyxVQUFVLEVBQ2YsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUMsaUJBQWlCLENBQy9DLENBQUM7S0FDSDtJQUVELE9BQU8sSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDOUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGlzRW1wdHlEYXRhIH0gZnJvbSBcIi4vaXNFbXB0eURhdGFcIjtcbmltcG9ydCB7IFNIQV8yNTZfSE1BQ19BTEdPIH0gZnJvbSBcIi4vY29uc3RhbnRzXCI7XG5pbXBvcnQgeyBIYXNoLCBTb3VyY2VEYXRhIH0gZnJvbSBcIkBhd3Mtc2RrL3R5cGVzXCI7XG5pbXBvcnQgeyBmcm9tVXRmOCB9IGZyb20gXCJAYXdzLXNkay91dGlsLXV0ZjgtYnJvd3NlclwiO1xuaW1wb3J0IHsgQ3J5cHRvT3BlcmF0aW9uLCBLZXksIE1zV2luZG93IH0gZnJvbSBcIkBhd3MtY3J5cHRvL2llMTEtZGV0ZWN0aW9uXCI7XG5pbXBvcnQgeyBsb2NhdGVXaW5kb3cgfSBmcm9tIFwiQGF3cy1zZGsvdXRpbC1sb2NhdGUtd2luZG93XCI7XG5cbmV4cG9ydCBjbGFzcyBTaGEyNTYgaW1wbGVtZW50cyBIYXNoIHtcbiAgcHJpdmF0ZSBvcGVyYXRpb246IFByb21pc2U8Q3J5cHRvT3BlcmF0aW9uPjtcblxuICBjb25zdHJ1Y3RvcihzZWNyZXQ/OiBTb3VyY2VEYXRhKSB7XG4gICAgaWYgKHNlY3JldCkge1xuICAgICAgdGhpcy5vcGVyYXRpb24gPSBnZXRLZXlQcm9taXNlKHNlY3JldCkudGhlbihrZXlEYXRhID0+XG4gICAgICAgIChsb2NhdGVXaW5kb3coKSBhcyBNc1dpbmRvdykubXNDcnlwdG8uc3VidGxlLnNpZ24oXG4gICAgICAgICAgU0hBXzI1Nl9ITUFDX0FMR08sXG4gICAgICAgICAga2V5RGF0YVxuICAgICAgICApXG4gICAgICApO1xuICAgICAgdGhpcy5vcGVyYXRpb24uY2F0Y2goKCkgPT4ge30pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm9wZXJhdGlvbiA9IFByb21pc2UucmVzb2x2ZShcbiAgICAgICAgKGxvY2F0ZVdpbmRvdygpIGFzIE1zV2luZG93KS5tc0NyeXB0by5zdWJ0bGUuZGlnZXN0KFwiU0hBLTI1NlwiKVxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICB1cGRhdGUodG9IYXNoOiBTb3VyY2VEYXRhKTogdm9pZCB7XG4gICAgaWYgKGlzRW1wdHlEYXRhKHRvSGFzaCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLm9wZXJhdGlvbiA9IHRoaXMub3BlcmF0aW9uLnRoZW4ob3BlcmF0aW9uID0+IHtcbiAgICAgIG9wZXJhdGlvbi5vbmVycm9yID0gKCkgPT4ge1xuICAgICAgICB0aGlzLm9wZXJhdGlvbiA9IFByb21pc2UucmVqZWN0KFxuICAgICAgICAgIG5ldyBFcnJvcihcIkVycm9yIGVuY291bnRlcmVkIHVwZGF0aW5nIGhhc2hcIilcbiAgICAgICAgKTtcbiAgICAgIH07XG4gICAgICBvcGVyYXRpb24ucHJvY2Vzcyh0b0FycmF5QnVmZmVyVmlldyh0b0hhc2gpKTtcblxuICAgICAgcmV0dXJuIG9wZXJhdGlvbjtcbiAgICB9KTtcbiAgICB0aGlzLm9wZXJhdGlvbi5jYXRjaCgoKSA9PiB7fSk7XG4gIH1cblxuICBkaWdlc3QoKTogUHJvbWlzZTxVaW50OEFycmF5PiB7XG4gICAgcmV0dXJuIHRoaXMub3BlcmF0aW9uLnRoZW48VWludDhBcnJheT4oXG4gICAgICBvcGVyYXRpb24gPT5cbiAgICAgICAgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgIG9wZXJhdGlvbi5vbmVycm9yID0gKCkgPT4ge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIkVycm9yIGVuY291bnRlcmVkIGZpbmFsaXppbmcgaGFzaFwiKSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgICBvcGVyYXRpb24ub25jb21wbGV0ZSA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmIChvcGVyYXRpb24ucmVzdWx0KSB7XG4gICAgICAgICAgICAgIHJlc29sdmUobmV3IFVpbnQ4QXJyYXkob3BlcmF0aW9uLnJlc3VsdCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIkVycm9yIGVuY291bnRlcmVkIGZpbmFsaXppbmcgaGFzaFwiKSk7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIG9wZXJhdGlvbi5maW5pc2goKTtcbiAgICAgICAgfSlcbiAgICApO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldEtleVByb21pc2Uoc2VjcmV0OiBTb3VyY2VEYXRhKTogUHJvbWlzZTxLZXk+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjb25zdCBrZXlPcGVyYXRpb24gPSAobG9jYXRlV2luZG93KCkgYXMgTXNXaW5kb3cpLm1zQ3J5cHRvLnN1YnRsZS5pbXBvcnRLZXkoXG4gICAgICBcInJhd1wiLFxuICAgICAgdG9BcnJheUJ1ZmZlclZpZXcoc2VjcmV0KSxcbiAgICAgIFNIQV8yNTZfSE1BQ19BTEdPLFxuICAgICAgZmFsc2UsXG4gICAgICBbXCJzaWduXCJdXG4gICAgKTtcblxuICAgIGtleU9wZXJhdGlvbi5vbmNvbXBsZXRlID0gKCkgPT4ge1xuICAgICAgaWYgKGtleU9wZXJhdGlvbi5yZXN1bHQpIHtcbiAgICAgICAgcmVzb2x2ZShrZXlPcGVyYXRpb24ucmVzdWx0KTtcbiAgICAgIH1cblxuICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIkltcG9ydEtleSBjb21wbGV0ZWQgd2l0aG91dCBpbXBvcnRpbmcga2V5LlwiKSk7XG4gICAgfTtcbiAgICBrZXlPcGVyYXRpb24ub25lcnJvciA9ICgpID0+IHtcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJJbXBvcnRLZXkgZmFpbGVkIHRvIGltcG9ydCBrZXkuXCIpKTtcbiAgICB9O1xuICB9KTtcbn1cblxuZnVuY3Rpb24gdG9BcnJheUJ1ZmZlclZpZXcoZGF0YTogU291cmNlRGF0YSk6IFVpbnQ4QXJyYXkge1xuICBpZiAodHlwZW9mIGRhdGEgPT09IFwic3RyaW5nXCIpIHtcbiAgICByZXR1cm4gZnJvbVV0ZjgoZGF0YSk7XG4gIH1cblxuICBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KGRhdGEpKSB7XG4gICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KFxuICAgICAgZGF0YS5idWZmZXIsXG4gICAgICBkYXRhLmJ5dGVPZmZzZXQsXG4gICAgICBkYXRhLmJ5dGVMZW5ndGggLyBVaW50OEFycmF5LkJZVEVTX1BFUl9FTEVNRU5UXG4gICAgKTtcbiAgfVxuXG4gIHJldHVybiBuZXcgVWludDhBcnJheShkYXRhKTtcbn1cbiJdfQ==