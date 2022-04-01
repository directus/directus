import { __extends } from "tslib";
import { AssumeRoleCommand } from "./commands/AssumeRoleCommand";
import { AssumeRoleWithSAMLCommand, } from "./commands/AssumeRoleWithSAMLCommand";
import { AssumeRoleWithWebIdentityCommand, } from "./commands/AssumeRoleWithWebIdentityCommand";
import { DecodeAuthorizationMessageCommand, } from "./commands/DecodeAuthorizationMessageCommand";
import { GetAccessKeyInfoCommand, } from "./commands/GetAccessKeyInfoCommand";
import { GetCallerIdentityCommand, } from "./commands/GetCallerIdentityCommand";
import { GetFederationTokenCommand, } from "./commands/GetFederationTokenCommand";
import { GetSessionTokenCommand, } from "./commands/GetSessionTokenCommand";
import { STSClient } from "./STSClient";
var STS = (function (_super) {
    __extends(STS, _super);
    function STS() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    STS.prototype.assumeRole = function (args, optionsOrCb, cb) {
        var command = new AssumeRoleCommand(args);
        if (typeof optionsOrCb === "function") {
            this.send(command, optionsOrCb);
        }
        else if (typeof cb === "function") {
            if (typeof optionsOrCb !== "object")
                throw new Error("Expect http options but get ".concat(typeof optionsOrCb));
            this.send(command, optionsOrCb || {}, cb);
        }
        else {
            return this.send(command, optionsOrCb);
        }
    };
    STS.prototype.assumeRoleWithSAML = function (args, optionsOrCb, cb) {
        var command = new AssumeRoleWithSAMLCommand(args);
        if (typeof optionsOrCb === "function") {
            this.send(command, optionsOrCb);
        }
        else if (typeof cb === "function") {
            if (typeof optionsOrCb !== "object")
                throw new Error("Expect http options but get ".concat(typeof optionsOrCb));
            this.send(command, optionsOrCb || {}, cb);
        }
        else {
            return this.send(command, optionsOrCb);
        }
    };
    STS.prototype.assumeRoleWithWebIdentity = function (args, optionsOrCb, cb) {
        var command = new AssumeRoleWithWebIdentityCommand(args);
        if (typeof optionsOrCb === "function") {
            this.send(command, optionsOrCb);
        }
        else if (typeof cb === "function") {
            if (typeof optionsOrCb !== "object")
                throw new Error("Expect http options but get ".concat(typeof optionsOrCb));
            this.send(command, optionsOrCb || {}, cb);
        }
        else {
            return this.send(command, optionsOrCb);
        }
    };
    STS.prototype.decodeAuthorizationMessage = function (args, optionsOrCb, cb) {
        var command = new DecodeAuthorizationMessageCommand(args);
        if (typeof optionsOrCb === "function") {
            this.send(command, optionsOrCb);
        }
        else if (typeof cb === "function") {
            if (typeof optionsOrCb !== "object")
                throw new Error("Expect http options but get ".concat(typeof optionsOrCb));
            this.send(command, optionsOrCb || {}, cb);
        }
        else {
            return this.send(command, optionsOrCb);
        }
    };
    STS.prototype.getAccessKeyInfo = function (args, optionsOrCb, cb) {
        var command = new GetAccessKeyInfoCommand(args);
        if (typeof optionsOrCb === "function") {
            this.send(command, optionsOrCb);
        }
        else if (typeof cb === "function") {
            if (typeof optionsOrCb !== "object")
                throw new Error("Expect http options but get ".concat(typeof optionsOrCb));
            this.send(command, optionsOrCb || {}, cb);
        }
        else {
            return this.send(command, optionsOrCb);
        }
    };
    STS.prototype.getCallerIdentity = function (args, optionsOrCb, cb) {
        var command = new GetCallerIdentityCommand(args);
        if (typeof optionsOrCb === "function") {
            this.send(command, optionsOrCb);
        }
        else if (typeof cb === "function") {
            if (typeof optionsOrCb !== "object")
                throw new Error("Expect http options but get ".concat(typeof optionsOrCb));
            this.send(command, optionsOrCb || {}, cb);
        }
        else {
            return this.send(command, optionsOrCb);
        }
    };
    STS.prototype.getFederationToken = function (args, optionsOrCb, cb) {
        var command = new GetFederationTokenCommand(args);
        if (typeof optionsOrCb === "function") {
            this.send(command, optionsOrCb);
        }
        else if (typeof cb === "function") {
            if (typeof optionsOrCb !== "object")
                throw new Error("Expect http options but get ".concat(typeof optionsOrCb));
            this.send(command, optionsOrCb || {}, cb);
        }
        else {
            return this.send(command, optionsOrCb);
        }
    };
    STS.prototype.getSessionToken = function (args, optionsOrCb, cb) {
        var command = new GetSessionTokenCommand(args);
        if (typeof optionsOrCb === "function") {
            this.send(command, optionsOrCb);
        }
        else if (typeof cb === "function") {
            if (typeof optionsOrCb !== "object")
                throw new Error("Expect http options but get ".concat(typeof optionsOrCb));
            this.send(command, optionsOrCb || {}, cb);
        }
        else {
            return this.send(command, optionsOrCb);
        }
    };
    return STS;
}(STSClient));
export { STS };
