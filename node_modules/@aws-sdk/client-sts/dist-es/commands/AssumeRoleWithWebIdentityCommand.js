import { __extends } from "tslib";
import { getSerdePlugin } from "@aws-sdk/middleware-serde";
import { Command as $Command } from "@aws-sdk/smithy-client";
import { AssumeRoleWithWebIdentityRequest, AssumeRoleWithWebIdentityResponse } from "../models/models_0";
import { deserializeAws_queryAssumeRoleWithWebIdentityCommand, serializeAws_queryAssumeRoleWithWebIdentityCommand, } from "../protocols/Aws_query";
var AssumeRoleWithWebIdentityCommand = (function (_super) {
    __extends(AssumeRoleWithWebIdentityCommand, _super);
    function AssumeRoleWithWebIdentityCommand(input) {
        var _this = _super.call(this) || this;
        _this.input = input;
        return _this;
    }
    AssumeRoleWithWebIdentityCommand.prototype.resolveMiddleware = function (clientStack, configuration, options) {
        this.middlewareStack.use(getSerdePlugin(configuration, this.serialize, this.deserialize));
        var stack = clientStack.concat(this.middlewareStack);
        var logger = configuration.logger;
        var clientName = "STSClient";
        var commandName = "AssumeRoleWithWebIdentityCommand";
        var handlerExecutionContext = {
            logger: logger,
            clientName: clientName,
            commandName: commandName,
            inputFilterSensitiveLog: AssumeRoleWithWebIdentityRequest.filterSensitiveLog,
            outputFilterSensitiveLog: AssumeRoleWithWebIdentityResponse.filterSensitiveLog,
        };
        var requestHandler = configuration.requestHandler;
        return stack.resolve(function (request) {
            return requestHandler.handle(request.request, options || {});
        }, handlerExecutionContext);
    };
    AssumeRoleWithWebIdentityCommand.prototype.serialize = function (input, context) {
        return serializeAws_queryAssumeRoleWithWebIdentityCommand(input, context);
    };
    AssumeRoleWithWebIdentityCommand.prototype.deserialize = function (output, context) {
        return deserializeAws_queryAssumeRoleWithWebIdentityCommand(output, context);
    };
    return AssumeRoleWithWebIdentityCommand;
}($Command));
export { AssumeRoleWithWebIdentityCommand };
