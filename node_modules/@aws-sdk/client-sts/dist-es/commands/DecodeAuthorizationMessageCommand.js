import { __extends } from "tslib";
import { getSerdePlugin } from "@aws-sdk/middleware-serde";
import { getAwsAuthPlugin } from "@aws-sdk/middleware-signing";
import { Command as $Command } from "@aws-sdk/smithy-client";
import { DecodeAuthorizationMessageRequest, DecodeAuthorizationMessageResponse } from "../models/models_0";
import { deserializeAws_queryDecodeAuthorizationMessageCommand, serializeAws_queryDecodeAuthorizationMessageCommand, } from "../protocols/Aws_query";
var DecodeAuthorizationMessageCommand = (function (_super) {
    __extends(DecodeAuthorizationMessageCommand, _super);
    function DecodeAuthorizationMessageCommand(input) {
        var _this = _super.call(this) || this;
        _this.input = input;
        return _this;
    }
    DecodeAuthorizationMessageCommand.prototype.resolveMiddleware = function (clientStack, configuration, options) {
        this.middlewareStack.use(getSerdePlugin(configuration, this.serialize, this.deserialize));
        this.middlewareStack.use(getAwsAuthPlugin(configuration));
        var stack = clientStack.concat(this.middlewareStack);
        var logger = configuration.logger;
        var clientName = "STSClient";
        var commandName = "DecodeAuthorizationMessageCommand";
        var handlerExecutionContext = {
            logger: logger,
            clientName: clientName,
            commandName: commandName,
            inputFilterSensitiveLog: DecodeAuthorizationMessageRequest.filterSensitiveLog,
            outputFilterSensitiveLog: DecodeAuthorizationMessageResponse.filterSensitiveLog,
        };
        var requestHandler = configuration.requestHandler;
        return stack.resolve(function (request) {
            return requestHandler.handle(request.request, options || {});
        }, handlerExecutionContext);
    };
    DecodeAuthorizationMessageCommand.prototype.serialize = function (input, context) {
        return serializeAws_queryDecodeAuthorizationMessageCommand(input, context);
    };
    DecodeAuthorizationMessageCommand.prototype.deserialize = function (output, context) {
        return deserializeAws_queryDecodeAuthorizationMessageCommand(output, context);
    };
    return DecodeAuthorizationMessageCommand;
}($Command));
export { DecodeAuthorizationMessageCommand };
