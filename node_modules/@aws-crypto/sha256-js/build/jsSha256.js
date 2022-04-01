"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sha256 = void 0;
var tslib_1 = require("tslib");
var constants_1 = require("./constants");
var RawSha256_1 = require("./RawSha256");
var util_1 = require("@aws-crypto/util");
var Sha256 = /** @class */ (function () {
    function Sha256(secret) {
        this.hash = new RawSha256_1.RawSha256();
        if (secret) {
            this.outer = new RawSha256_1.RawSha256();
            var inner = bufferFromSecret(secret);
            var outer = new Uint8Array(constants_1.BLOCK_SIZE);
            outer.set(inner);
            for (var i = 0; i < constants_1.BLOCK_SIZE; i++) {
                inner[i] ^= 0x36;
                outer[i] ^= 0x5c;
            }
            this.hash.update(inner);
            this.outer.update(outer);
            // overwrite the copied key in memory
            for (var i = 0; i < inner.byteLength; i++) {
                inner[i] = 0;
            }
        }
    }
    Sha256.prototype.update = function (toHash) {
        if ((0, util_1.isEmptyData)(toHash) || this.error) {
            return;
        }
        try {
            this.hash.update((0, util_1.convertToBuffer)(toHash));
        }
        catch (e) {
            this.error = e;
        }
    };
    /* This synchronous method keeps compatibility
     * with the v2 aws-sdk.
     */
    Sha256.prototype.digestSync = function () {
        if (this.error) {
            throw this.error;
        }
        if (this.outer) {
            if (!this.outer.finished) {
                this.outer.update(this.hash.digest());
            }
            return this.outer.digest();
        }
        return this.hash.digest();
    };
    /* The underlying digest method here is synchronous.
     * To keep the same interface with the other hash functions
     * the default is to expose this as an async method.
     * However, it can sometimes be useful to have a sync method.
     */
    Sha256.prototype.digest = function () {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
            return (0, tslib_1.__generator)(this, function (_a) {
                return [2 /*return*/, this.digestSync()];
            });
        });
    };
    return Sha256;
}());
exports.Sha256 = Sha256;
function bufferFromSecret(secret) {
    var input = (0, util_1.convertToBuffer)(secret);
    if (input.byteLength > constants_1.BLOCK_SIZE) {
        var bufferHash = new RawSha256_1.RawSha256();
        bufferHash.update(input);
        input = bufferHash.digest();
    }
    var buffer = new Uint8Array(constants_1.BLOCK_SIZE);
    buffer.set(input);
    return buffer;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNTaGEyNTYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvanNTaGEyNTYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLHlDQUF5QztBQUN6Qyx5Q0FBd0M7QUFFeEMseUNBQWdFO0FBRWhFO0lBS0UsZ0JBQVksTUFBbUI7UUFKZCxTQUFJLEdBQUcsSUFBSSxxQkFBUyxFQUFFLENBQUM7UUFLdEMsSUFBSSxNQUFNLEVBQUU7WUFDVixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUkscUJBQVMsRUFBRSxDQUFDO1lBQzdCLElBQU0sS0FBSyxHQUFHLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3ZDLElBQU0sS0FBSyxHQUFHLElBQUksVUFBVSxDQUFDLHNCQUFVLENBQUMsQ0FBQztZQUN6QyxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRWpCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxzQkFBVSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUNuQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDO2dCQUNqQixLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDO2FBQ2xCO1lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDeEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFekIscUNBQXFDO1lBQ3JDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsVUFBVSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUN6QyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ2Q7U0FDRjtJQUNILENBQUM7SUFFRCx1QkFBTSxHQUFOLFVBQU8sTUFBa0I7UUFDdkIsSUFBSSxJQUFBLGtCQUFXLEVBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNyQyxPQUFPO1NBQ1I7UUFFRCxJQUFJO1lBQ0YsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBQSxzQkFBZSxFQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7U0FDM0M7UUFBQyxPQUFPLENBQUMsRUFBRTtZQUNWLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO1NBQ2hCO0lBQ0gsQ0FBQztJQUVEOztPQUVHO0lBQ0gsMkJBQVUsR0FBVjtRQUNFLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNkLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQztTQUNsQjtRQUVELElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNkLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRTtnQkFDeEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO2FBQ3ZDO1lBRUQsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO1NBQzVCO1FBRUQsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQzVCLENBQUM7SUFFRDs7OztPQUlHO0lBQ0csdUJBQU0sR0FBWjs7O2dCQUNFLHNCQUFPLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFBQzs7O0tBQzFCO0lBQ0gsYUFBQztBQUFELENBQUMsQUFsRUQsSUFrRUM7QUFsRVksd0JBQU07QUFvRW5CLFNBQVMsZ0JBQWdCLENBQUMsTUFBa0I7SUFDMUMsSUFBSSxLQUFLLEdBQUcsSUFBQSxzQkFBZSxFQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRXBDLElBQUksS0FBSyxDQUFDLFVBQVUsR0FBRyxzQkFBVSxFQUFFO1FBQ2pDLElBQU0sVUFBVSxHQUFHLElBQUkscUJBQVMsRUFBRSxDQUFDO1FBQ25DLFVBQVUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekIsS0FBSyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztLQUM3QjtJQUVELElBQU0sTUFBTSxHQUFHLElBQUksVUFBVSxDQUFDLHNCQUFVLENBQUMsQ0FBQztJQUMxQyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2xCLE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCTE9DS19TSVpFIH0gZnJvbSBcIi4vY29uc3RhbnRzXCI7XG5pbXBvcnQgeyBSYXdTaGEyNTYgfSBmcm9tIFwiLi9SYXdTaGEyNTZcIjtcbmltcG9ydCB7IEhhc2gsIFNvdXJjZURhdGEgfSBmcm9tIFwiQGF3cy1zZGsvdHlwZXNcIjtcbmltcG9ydCB7IGlzRW1wdHlEYXRhLCBjb252ZXJ0VG9CdWZmZXIgfSBmcm9tIFwiQGF3cy1jcnlwdG8vdXRpbFwiO1xuXG5leHBvcnQgY2xhc3MgU2hhMjU2IGltcGxlbWVudHMgSGFzaCB7XG4gIHByaXZhdGUgcmVhZG9ubHkgaGFzaCA9IG5ldyBSYXdTaGEyNTYoKTtcbiAgcHJpdmF0ZSByZWFkb25seSBvdXRlcj86IFJhd1NoYTI1NjtcbiAgcHJpdmF0ZSBlcnJvcjogYW55O1xuXG4gIGNvbnN0cnVjdG9yKHNlY3JldD86IFNvdXJjZURhdGEpIHtcbiAgICBpZiAoc2VjcmV0KSB7XG4gICAgICB0aGlzLm91dGVyID0gbmV3IFJhd1NoYTI1NigpO1xuICAgICAgY29uc3QgaW5uZXIgPSBidWZmZXJGcm9tU2VjcmV0KHNlY3JldCk7XG4gICAgICBjb25zdCBvdXRlciA9IG5ldyBVaW50OEFycmF5KEJMT0NLX1NJWkUpO1xuICAgICAgb3V0ZXIuc2V0KGlubmVyKTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBCTE9DS19TSVpFOyBpKyspIHtcbiAgICAgICAgaW5uZXJbaV0gXj0gMHgzNjtcbiAgICAgICAgb3V0ZXJbaV0gXj0gMHg1YztcbiAgICAgIH1cblxuICAgICAgdGhpcy5oYXNoLnVwZGF0ZShpbm5lcik7XG4gICAgICB0aGlzLm91dGVyLnVwZGF0ZShvdXRlcik7XG5cbiAgICAgIC8vIG92ZXJ3cml0ZSB0aGUgY29waWVkIGtleSBpbiBtZW1vcnlcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5uZXIuYnl0ZUxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlubmVyW2ldID0gMDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB1cGRhdGUodG9IYXNoOiBTb3VyY2VEYXRhKTogdm9pZCB7XG4gICAgaWYgKGlzRW1wdHlEYXRhKHRvSGFzaCkgfHwgdGhpcy5lcnJvcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICB0aGlzLmhhc2gudXBkYXRlKGNvbnZlcnRUb0J1ZmZlcih0b0hhc2gpKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aGlzLmVycm9yID0gZTtcbiAgICB9XG4gIH1cblxuICAvKiBUaGlzIHN5bmNocm9ub3VzIG1ldGhvZCBrZWVwcyBjb21wYXRpYmlsaXR5XG4gICAqIHdpdGggdGhlIHYyIGF3cy1zZGsuXG4gICAqL1xuICBkaWdlc3RTeW5jKCk6IFVpbnQ4QXJyYXkge1xuICAgIGlmICh0aGlzLmVycm9yKSB7XG4gICAgICB0aHJvdyB0aGlzLmVycm9yO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm91dGVyKSB7XG4gICAgICBpZiAoIXRoaXMub3V0ZXIuZmluaXNoZWQpIHtcbiAgICAgICAgdGhpcy5vdXRlci51cGRhdGUodGhpcy5oYXNoLmRpZ2VzdCgpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMub3V0ZXIuZGlnZXN0KCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuaGFzaC5kaWdlc3QoKTtcbiAgfVxuXG4gIC8qIFRoZSB1bmRlcmx5aW5nIGRpZ2VzdCBtZXRob2QgaGVyZSBpcyBzeW5jaHJvbm91cy5cbiAgICogVG8ga2VlcCB0aGUgc2FtZSBpbnRlcmZhY2Ugd2l0aCB0aGUgb3RoZXIgaGFzaCBmdW5jdGlvbnNcbiAgICogdGhlIGRlZmF1bHQgaXMgdG8gZXhwb3NlIHRoaXMgYXMgYW4gYXN5bmMgbWV0aG9kLlxuICAgKiBIb3dldmVyLCBpdCBjYW4gc29tZXRpbWVzIGJlIHVzZWZ1bCB0byBoYXZlIGEgc3luYyBtZXRob2QuXG4gICAqL1xuICBhc3luYyBkaWdlc3QoKTogUHJvbWlzZTxVaW50OEFycmF5PiB7XG4gICAgcmV0dXJuIHRoaXMuZGlnZXN0U3luYygpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGJ1ZmZlckZyb21TZWNyZXQoc2VjcmV0OiBTb3VyY2VEYXRhKTogVWludDhBcnJheSB7XG4gIGxldCBpbnB1dCA9IGNvbnZlcnRUb0J1ZmZlcihzZWNyZXQpO1xuXG4gIGlmIChpbnB1dC5ieXRlTGVuZ3RoID4gQkxPQ0tfU0laRSkge1xuICAgIGNvbnN0IGJ1ZmZlckhhc2ggPSBuZXcgUmF3U2hhMjU2KCk7XG4gICAgYnVmZmVySGFzaC51cGRhdGUoaW5wdXQpO1xuICAgIGlucHV0ID0gYnVmZmVySGFzaC5kaWdlc3QoKTtcbiAgfVxuXG4gIGNvbnN0IGJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KEJMT0NLX1NJWkUpO1xuICBidWZmZXIuc2V0KGlucHV0KTtcbiAgcmV0dXJuIGJ1ZmZlcjtcbn1cbiJdfQ==