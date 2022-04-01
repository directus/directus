"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Command = void 0;
const middleware_stack_1 = require("@aws-sdk/middleware-stack");
class Command {
    constructor() {
        this.middlewareStack = (0, middleware_stack_1.constructStack)();
    }
}
exports.Command = Command;
