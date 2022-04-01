"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sha256 = void 0;
var ie11Sha256_1 = require("./ie11Sha256");
var webCryptoSha256_1 = require("./webCryptoSha256");
var sha256_js_1 = require("@aws-crypto/sha256-js");
var supports_web_crypto_1 = require("@aws-crypto/supports-web-crypto");
var ie11_detection_1 = require("@aws-crypto/ie11-detection");
var util_locate_window_1 = require("@aws-sdk/util-locate-window");
var Sha256 = /** @class */ (function () {
    function Sha256(secret) {
        if ((0, supports_web_crypto_1.supportsWebCrypto)((0, util_locate_window_1.locateWindow)())) {
            this.hash = new webCryptoSha256_1.Sha256(secret);
        }
        else if ((0, ie11_detection_1.isMsWindow)((0, util_locate_window_1.locateWindow)())) {
            this.hash = new ie11Sha256_1.Sha256(secret);
        }
        else {
            this.hash = new sha256_js_1.Sha256(secret);
        }
    }
    Sha256.prototype.update = function (data, encoding) {
        this.hash.update(data, encoding);
    };
    Sha256.prototype.digest = function () {
        return this.hash.digest();
    };
    return Sha256;
}());
exports.Sha256 = Sha256;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Jvc3NQbGF0Zm9ybVNoYTI1Ni5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9jcm9zc1BsYXRmb3JtU2hhMjU2LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDJDQUFvRDtBQUNwRCxxREFBOEQ7QUFDOUQsbURBQTJEO0FBRTNELHVFQUFvRTtBQUNwRSw2REFBd0Q7QUFDeEQsa0VBQTJEO0FBRTNEO0lBR0UsZ0JBQVksTUFBbUI7UUFDN0IsSUFBSSxJQUFBLHVDQUFpQixFQUFDLElBQUEsaUNBQVksR0FBRSxDQUFDLEVBQUU7WUFDckMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLHdCQUFlLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDekM7YUFBTSxJQUFJLElBQUEsMkJBQVUsRUFBQyxJQUFBLGlDQUFZLEdBQUUsQ0FBQyxFQUFFO1lBQ3JDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxtQkFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ3BDO2FBQU07WUFDTCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksa0JBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUNsQztJQUNILENBQUM7SUFFRCx1QkFBTSxHQUFOLFVBQU8sSUFBZ0IsRUFBRSxRQUFzQztRQUM3RCxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDbkMsQ0FBQztJQUVELHVCQUFNLEdBQU47UUFDRSxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDNUIsQ0FBQztJQUNILGFBQUM7QUFBRCxDQUFDLEFBcEJELElBb0JDO0FBcEJZLHdCQUFNIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgU2hhMjU2IGFzIEllMTFTaGEyNTYgfSBmcm9tIFwiLi9pZTExU2hhMjU2XCI7XG5pbXBvcnQgeyBTaGEyNTYgYXMgV2ViQ3J5cHRvU2hhMjU2IH0gZnJvbSBcIi4vd2ViQ3J5cHRvU2hhMjU2XCI7XG5pbXBvcnQgeyBTaGEyNTYgYXMgSnNTaGEyNTYgfSBmcm9tIFwiQGF3cy1jcnlwdG8vc2hhMjU2LWpzXCI7XG5pbXBvcnQgeyBIYXNoLCBTb3VyY2VEYXRhIH0gZnJvbSBcIkBhd3Mtc2RrL3R5cGVzXCI7XG5pbXBvcnQgeyBzdXBwb3J0c1dlYkNyeXB0byB9IGZyb20gXCJAYXdzLWNyeXB0by9zdXBwb3J0cy13ZWItY3J5cHRvXCI7XG5pbXBvcnQgeyBpc01zV2luZG93IH0gZnJvbSBcIkBhd3MtY3J5cHRvL2llMTEtZGV0ZWN0aW9uXCI7XG5pbXBvcnQgeyBsb2NhdGVXaW5kb3cgfSBmcm9tIFwiQGF3cy1zZGsvdXRpbC1sb2NhdGUtd2luZG93XCI7XG5cbmV4cG9ydCBjbGFzcyBTaGEyNTYgaW1wbGVtZW50cyBIYXNoIHtcbiAgcHJpdmF0ZSByZWFkb25seSBoYXNoOiBIYXNoO1xuXG4gIGNvbnN0cnVjdG9yKHNlY3JldD86IFNvdXJjZURhdGEpIHtcbiAgICBpZiAoc3VwcG9ydHNXZWJDcnlwdG8obG9jYXRlV2luZG93KCkpKSB7XG4gICAgICB0aGlzLmhhc2ggPSBuZXcgV2ViQ3J5cHRvU2hhMjU2KHNlY3JldCk7XG4gICAgfSBlbHNlIGlmIChpc01zV2luZG93KGxvY2F0ZVdpbmRvdygpKSkge1xuICAgICAgdGhpcy5oYXNoID0gbmV3IEllMTFTaGEyNTYoc2VjcmV0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5oYXNoID0gbmV3IEpzU2hhMjU2KHNlY3JldCk7XG4gICAgfVxuICB9XG5cbiAgdXBkYXRlKGRhdGE6IFNvdXJjZURhdGEsIGVuY29kaW5nPzogXCJ1dGY4XCIgfCBcImFzY2lpXCIgfCBcImxhdGluMVwiKTogdm9pZCB7XG4gICAgdGhpcy5oYXNoLnVwZGF0ZShkYXRhLCBlbmNvZGluZyk7XG4gIH1cblxuICBkaWdlc3QoKTogUHJvbWlzZTxVaW50OEFycmF5PiB7XG4gICAgcmV0dXJuIHRoaXMuaGFzaC5kaWdlc3QoKTtcbiAgfVxufVxuIl19