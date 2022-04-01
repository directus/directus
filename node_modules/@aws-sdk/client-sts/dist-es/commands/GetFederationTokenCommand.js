import { __extends } from "tslib";
import { getSerdePlugin } from "@aws-sdk/middleware-serde";
import { getAwsAuthPlugin } from "@aws-sdk/middleware-signing";
import { Command as $Command } from "@aws-sdk/smithy-client";
import { GetFederationTokenRequest, GetFederationTokenResponse } from "../models/models_0";
import { deserializeAws_queryGetFederationTokenCommand, serializeAws_queryGetFederationTokenCommand, } from "../protocols/Aws_query";
var GetFederationTokenCommand = (function (_super) {
    __extends(GetFederationTokenCommand, _super);
    function GetFederationTokenCommand(input) {
        var _this = _super.call(this) || this;
        _this.input = input;
        return _this;
    }
    GetFederationTokenCommand.prototype.resolveMiddleware = function (clientStack, configuration, options) {
        this.middlewareStack.use(getSerdePlugin(configuration, this.serialize, this.deserialize));
        this.middlewareStack.use(getAwsAuthPlugin(configuration));
        var stack = clientStack.concat(this.middlewareStack);
        var logger = configuration.logger;
        var clientName = "STSClient";
        var commandName = "GetFederationTokenCommand";
        var handlerExecutionContext = {
            logger: logger,
            clientName: clientName,
            commandName: commandName,
            inputFilterSensitiveLog: GetFederationTokenRequest.filterSensitiveLog,
            outputFilterSensitiveLog: GetFederationTokenResponse.filterSensitiveLog,
        };
        var requestHandler = configuration.requestHandler;
        return stack.resolve(function (request) {
            return requestHandler.handle(request.request, options || {});
        }, handlerExecutionContext);
    };
    GetFederationTokenCommand.prototype.serialize = function (input, context) {
        return serializeAws_queryGetFederationTokenCommand(input, context);
    };
    GetFederationTokenCommand.prototype.deserialize = function (output, context) {
        return deserializeAws_queryGetFederationTokenCommand(output, context);
    };
    return GetFederationTokenCommand;
}($Command));
export { GetFederationTokenCommand };
