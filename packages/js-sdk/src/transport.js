export class ITransport {
}
export class TransportError extends Error {
    constructor(parent, response) {
        var _a, _b;
        if ((_a = response === null || response === void 0 ? void 0 : response.errors) === null || _a === void 0 ? void 0 : _a.length) {
            super((_b = response === null || response === void 0 ? void 0 : response.errors[0]) === null || _b === void 0 ? void 0 : _b.message);
        }
        else {
            super((parent === null || parent === void 0 ? void 0 : parent.message) || 'Unknown transport error');
        }
        this.parent = parent;
        this.response = response;
        this.errors = (response === null || response === void 0 ? void 0 : response.errors) || [];
        if (!Object.values(response || {}).some((value) => value !== undefined)) {
            this.response = undefined;
        }
        Object.setPrototypeOf(this, TransportError.prototype);
    }
}
