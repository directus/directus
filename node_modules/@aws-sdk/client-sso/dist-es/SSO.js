import { __extends } from "tslib";
import { GetRoleCredentialsCommand, } from "./commands/GetRoleCredentialsCommand";
import { ListAccountRolesCommand, } from "./commands/ListAccountRolesCommand";
import { ListAccountsCommand, } from "./commands/ListAccountsCommand";
import { LogoutCommand } from "./commands/LogoutCommand";
import { SSOClient } from "./SSOClient";
var SSO = (function (_super) {
    __extends(SSO, _super);
    function SSO() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SSO.prototype.getRoleCredentials = function (args, optionsOrCb, cb) {
        var command = new GetRoleCredentialsCommand(args);
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
    SSO.prototype.listAccountRoles = function (args, optionsOrCb, cb) {
        var command = new ListAccountRolesCommand(args);
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
    SSO.prototype.listAccounts = function (args, optionsOrCb, cb) {
        var command = new ListAccountsCommand(args);
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
    SSO.prototype.logout = function (args, optionsOrCb, cb) {
        var command = new LogoutCommand(args);
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
    return SSO;
}(SSOClient));
export { SSO };
