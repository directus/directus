"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSerdePlugin = exports.serializerMiddlewareOption = exports.deserializerMiddlewareOption = void 0;
const deserializerMiddleware_1 = require("./deserializerMiddleware");
const serializerMiddleware_1 = require("./serializerMiddleware");
exports.deserializerMiddlewareOption = {
    name: "deserializerMiddleware",
    step: "deserialize",
    tags: ["DESERIALIZER"],
    override: true,
};
exports.serializerMiddlewareOption = {
    name: "serializerMiddleware",
    step: "serialize",
    tags: ["SERIALIZER"],
    override: true,
};
function getSerdePlugin(config, serializer, deserializer) {
    return {
        applyToStack: (commandStack) => {
            commandStack.add((0, deserializerMiddleware_1.deserializerMiddleware)(config, deserializer), exports.deserializerMiddlewareOption);
            commandStack.add((0, serializerMiddleware_1.serializerMiddleware)(config, serializer), exports.serializerMiddlewareOption);
        },
    };
}
exports.getSerdePlugin = getSerdePlugin;
