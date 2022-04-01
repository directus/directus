import { __extends } from "tslib";
import { getSerdePlugin } from "@aws-sdk/middleware-serde";
import { getAwsAuthPlugin } from "@aws-sdk/middleware-signing";
import { Command as $Command } from "@aws-sdk/smithy-client";
import { GetCallerIdentityRequest, GetCallerIdentityResponse } from "../models/models_0";
import { deserializeAws_queryGetCallerIdentityCommand, serializeAws_queryGetCallerIdentityCommand, } from "../protocols/Aws_query";
var GetCallerIdentityCommand = (function (_super) {
    __extends(GetCallerIdentityCommand, _super);
    function GetCallerIdentityCommand(input) {
        var _this = _super.call(this) || this;
        _this.input = input;
        return _this;
    }
    GetCallerIdentityCommand.prototype.resolveMiddleware = function (clientStack, configuration, options) {
        this.middlewareStack.use(getSerdePlugin(configuration, this.serialize, this.deserialize));
        this.middlewareStack.use(getAwsAuthPlugin(configuration));
        var stack = clientStack.concat(this.middlewareStack);
        var logger = configuration.logger;
        var clientName = "STSClient";
        var commandName = "GetCallerIdentityCommand";
        var handlerExecutionContext = {
            logger: logger,
            clientName: clientName,
            commandName: commandName,
            inputFilterSensitiveLog: GetCallerIdentityRequest.filterSensitiveLog,
            outputFilterSensitiveLog: GetCallerIdentityResponse.filterSensitiveLog,
        };
        var requestHandler = configuration.requestHandler;
        return stack.resolve(function (request) {
            return requestHandler.handle(request.request, options || {});
        }, handlerExecutionContext);
    };
    GetCallerIdentityCommand.prototype.serialize = function (input, context) {
        return serializeAws_queryGetCallerIdentityCommand(input, context);
    };
    GetCallerIdentityCommand.prototype.deserialize = function (output, context) {
        return deserializeAws_queryGetCallerIdentityCommand(output, context);
    };
    return GetCallerIdentityCommand;
}($Command));
export { GetCallerIdentityCommand };
