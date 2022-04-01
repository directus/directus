import { __awaiter, __generator } from "tslib";
import { HttpRequest } from "@aws-sdk/protocol-http";
import { INVOCATION_ID_HEADER, REQUEST_HEADER } from "./constants";
export var omitRetryHeadersMiddleware = function () {
    return function (next) {
        return function (args) { return __awaiter(void 0, void 0, void 0, function () {
            var request;
            return __generator(this, function (_a) {
                request = args.request;
                if (HttpRequest.isInstance(request)) {
                    delete request.headers[INVOCATION_ID_HEADER];
                    delete request.headers[REQUEST_HEADER];
                }
                return [2, next(args)];
            });
        }); };
    };
};
export var omitRetryHeadersMiddlewareOptions = {
    name: "omitRetryHeadersMiddleware",
    tags: ["RETRY", "HEADERS", "OMIT_RETRY_HEADERS"],
    relation: "before",
    toMiddleware: "awsAuthMiddleware",
    override: true,
};
export var getOmitRetryHeadersPlugin = function (options) { return ({
    applyToStack: function (clientStack) {
        clientStack.addRelativeTo(omitRetryHeadersMiddleware(), omitRetryHeadersMiddlewareOptions);
    },
}); };
