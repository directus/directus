import { __awaiter, __generator, __rest } from "tslib";
export var loggerMiddleware = function () {
    return function (next, context) {
        return function (args) { return __awaiter(void 0, void 0, void 0, function () {
            var clientName, commandName, inputFilterSensitiveLog, logger, outputFilterSensitiveLog, response, _a, $metadata, outputWithoutMetadata;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        clientName = context.clientName, commandName = context.commandName, inputFilterSensitiveLog = context.inputFilterSensitiveLog, logger = context.logger, outputFilterSensitiveLog = context.outputFilterSensitiveLog;
                        return [4, next(args)];
                    case 1:
                        response = _b.sent();
                        if (!logger) {
                            return [2, response];
                        }
                        if (typeof logger.info === "function") {
                            _a = response.output, $metadata = _a.$metadata, outputWithoutMetadata = __rest(_a, ["$metadata"]);
                            logger.info({
                                clientName: clientName,
                                commandName: commandName,
                                input: inputFilterSensitiveLog(args.input),
                                output: outputFilterSensitiveLog(outputWithoutMetadata),
                                metadata: $metadata,
                            });
                        }
                        return [2, response];
                }
            });
        }); };
    };
};
export var loggerMiddlewareOptions = {
    name: "loggerMiddleware",
    tags: ["LOGGER"],
    step: "initialize",
    override: true,
};
export var getLoggerPlugin = function (options) { return ({
    applyToStack: function (clientStack) {
        clientStack.add(loggerMiddleware(), loggerMiddlewareOptions);
    },
}); };
