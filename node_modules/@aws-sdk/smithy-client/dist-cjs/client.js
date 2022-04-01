"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const middleware_stack_1 = require("@aws-sdk/middleware-stack");
class Client {
    constructor(config) {
        this.middlewareStack = (0, middleware_stack_1.constructStack)();
        this.config = config;
    }
    send(command, optionsOrCb, cb) {
        const options = typeof optionsOrCb !== "function" ? optionsOrCb : undefined;
        const callback = typeof optionsOrCb === "function" ? optionsOrCb : cb;
        const handler = command.resolveMiddleware(this.middlewareStack, this.config, options);
        if (callback) {
            handler(command)
                .then((result) => callback(null, result.output), (err) => callback(err))
                .catch(() => { });
        }
        else {
            return handler(command).then((result) => result.output);
        }
    }
    destroy() {
        if (this.config.requestHandler.destroy)
            this.config.requestHandler.destroy();
    }
}
exports.Client = Client;
