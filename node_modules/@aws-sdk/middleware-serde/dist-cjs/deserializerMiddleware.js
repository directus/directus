"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deserializerMiddleware = void 0;
const deserializerMiddleware = (options, deserializer) => (next, context) => async (args) => {
    const { response } = await next(args);
    try {
        const parsed = await deserializer(response, options);
        return {
            response,
            output: parsed,
        };
    }
    catch (error) {
        Object.defineProperty(error, "$response", {
            value: response,
        });
        throw error;
    }
};
exports.deserializerMiddleware = deserializerMiddleware;
