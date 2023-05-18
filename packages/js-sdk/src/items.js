export var Meta;
(function (Meta) {
    Meta["TOTAL_COUNT"] = "total_count";
    Meta["FILTER_COUNT"] = "filter_count";
})(Meta || (Meta = {}));
export class EmptyParamError extends Error {
    constructor(paramName) {
        super(`${paramName !== null && paramName !== void 0 ? paramName : 'ID'} cannot be an empty string`);
    }
}
