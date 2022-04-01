import { __extends } from "tslib";
import { getSerdePlugin } from "@aws-sdk/middleware-serde";
import { getAwsAuthPlugin } from "@aws-sdk/middleware-signing";
import { Command as $Command } from "@aws-sdk/smithy-client";
import { AssumeRoleRequest, AssumeRoleResponse } from "../models/models_0";
import { deserializeAws_queryAssumeRoleCommand, serializeAws_queryAssumeRoleCommand } from "../protocols/Aws_query";
var AssumeRoleCommand = (function (_super) {
    __extends(AssumeRoleCommand, _super);
    function AssumeRoleCommand(input) {
        var _this = _super.call(this) || this;
        _this.input = input;
        return _this;
    }
    AssumeRoleCommand.prototype.resolveMiddleware = function (clientStack, configuration, options) {
        this.middlewareStack.use(getSerdePlugin(configuration, this.serialize, this.deserialize));
        this.middlewareStack.use(getAwsAuthPlugin(configuration));
        var stack = clientStack.concat(this.middlewareStack);
        var logger = configuration.logger;
        var clientName = "STSClient";
        var commandName = "AssumeRoleCommand";
        var handlerExecutionContext = {
            logger: logger,
            clientName: clientName,
            commandName: commandName,
            inputFilterSensitiveLog: AssumeRoleRequest.filterSensitiveLog,
            outputFilterSensitiveLog: AssumeRoleResponse.filterSensitiveLog,
        };
        var requestHandler = configuration.requestHandler;
        return stack.resolve(function (request) {
            return requestHandler.handle(request.request, options || {});
        }, handlerExecutionContext);
    };
    AssumeRoleCommand.prototype.serialize = function (input, context) {
        return serializeAws_queryAssumeRoleCommand(input, context);
    };
    AssumeRoleCommand.prototype.deserialize = function (output, context) {
        return deserializeAws_queryAssumeRoleCommand(output, context);
    };
    return AssumeRoleCommand;
}($Command));
export { AssumeRoleCommand };
