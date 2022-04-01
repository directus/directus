import { __extends } from "tslib";
import { getSerdePlugin } from "@aws-sdk/middleware-serde";
import { getAwsAuthPlugin } from "@aws-sdk/middleware-signing";
import { Command as $Command } from "@aws-sdk/smithy-client";
import { GetAccessKeyInfoRequest, GetAccessKeyInfoResponse } from "../models/models_0";
import { deserializeAws_queryGetAccessKeyInfoCommand, serializeAws_queryGetAccessKeyInfoCommand, } from "../protocols/Aws_query";
var GetAccessKeyInfoCommand = (function (_super) {
    __extends(GetAccessKeyInfoCommand, _super);
    function GetAccessKeyInfoCommand(input) {
        var _this = _super.call(this) || this;
        _this.input = input;
        return _this;
    }
    GetAccessKeyInfoCommand.prototype.resolveMiddleware = function (clientStack, configuration, options) {
        this.middlewareStack.use(getSerdePlugin(configuration, this.serialize, this.deserialize));
        this.middlewareStack.use(getAwsAuthPlugin(configuration));
        var stack = clientStack.concat(this.middlewareStack);
        var logger = configuration.logger;
        var clientName = "STSClient";
        var commandName = "GetAccessKeyInfoCommand";
        var handlerExecutionContext = {
            logger: logger,
            clientName: clientName,
            commandName: commandName,
            inputFilterSensitiveLog: GetAccessKeyInfoRequest.filterSensitiveLog,
            outputFilterSensitiveLog: GetAccessKeyInfoResponse.filterSensitiveLog,
        };
        var requestHandler = configuration.requestHandler;
        return stack.resolve(function (request) {
            return requestHandler.handle(request.request, options || {});
        }, handlerExecutionContext);
    };
    GetAccessKeyInfoCommand.prototype.serialize = function (input, context) {
        return serializeAws_queryGetAccessKeyInfoCommand(input, context);
    };
    GetAccessKeyInfoCommand.prototype.deserialize = function (output, context) {
        return deserializeAws_queryGetAccessKeyInfoCommand(output, context);
    };
    return GetAccessKeyInfoCommand;
}($Command));
export { GetAccessKeyInfoCommand };
