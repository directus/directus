import { __extends } from "tslib";
import { getSerdePlugin } from "@aws-sdk/middleware-serde";
import { Command as $Command } from "@aws-sdk/smithy-client";
import { AssumeRoleWithSAMLRequest, AssumeRoleWithSAMLResponse } from "../models/models_0";
import { deserializeAws_queryAssumeRoleWithSAMLCommand, serializeAws_queryAssumeRoleWithSAMLCommand, } from "../protocols/Aws_query";
var AssumeRoleWithSAMLCommand = (function (_super) {
    __extends(AssumeRoleWithSAMLCommand, _super);
    function AssumeRoleWithSAMLCommand(input) {
        var _this = _super.call(this) || this;
        _this.input = input;
        return _this;
    }
    AssumeRoleWithSAMLCommand.prototype.resolveMiddleware = function (clientStack, configuration, options) {
        this.middlewareStack.use(getSerdePlugin(configuration, this.serialize, this.deserialize));
        var stack = clientStack.concat(this.middlewareStack);
        var logger = configuration.logger;
        var clientName = "STSClient";
        var commandName = "AssumeRoleWithSAMLCommand";
        var handlerExecutionContext = {
            logger: logger,
            clientName: clientName,
            commandName: commandName,
            inputFilterSensitiveLog: AssumeRoleWithSAMLRequest.filterSensitiveLog,
            outputFilterSensitiveLog: AssumeRoleWithSAMLResponse.filterSensitiveLog,
        };
        var requestHandler = configuration.requestHandler;
        return stack.resolve(function (request) {
            return requestHandler.handle(request.request, options || {});
        }, handlerExecutionContext);
    };
    AssumeRoleWithSAMLCommand.prototype.serialize = function (input, context) {
        return serializeAws_queryAssumeRoleWithSAMLCommand(input, context);
    };
    AssumeRoleWithSAMLCommand.prototype.deserialize = function (output, context) {
        return deserializeAws_queryAssumeRoleWithSAMLCommand(output, context);
    };
    return AssumeRoleWithSAMLCommand;
}($Command));
export { AssumeRoleWithSAMLCommand };
