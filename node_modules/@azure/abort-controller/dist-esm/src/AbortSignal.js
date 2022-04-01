// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
var listenersMap = new WeakMap();
var abortedMap = new WeakMap();
/**
 * An aborter instance implements AbortSignal interface, can abort HTTP requests.
 *
 * - Call AbortSignal.none to create a new AbortSignal instance that cannot be cancelled.
 * Use `AbortSignal.none` when you are required to pass a cancellation token but the operation
 * cannot or will not ever be cancelled.
 *
 * @example
 * Abort without timeout
 * ```ts
 * await doAsyncWork(AbortSignal.none);
 * ```
 */
var AbortSignal = /** @class */ (function () {
    function AbortSignal() {
        /**
         * onabort event listener.
         */
        this.onabort = null;
        listenersMap.set(this, []);
        abortedMap.set(this, false);
    }
    Object.defineProperty(AbortSignal.prototype, "aborted", {
        /**
         * Status of whether aborted or not.
         *
         * @readonly
         */
        get: function () {
            if (!abortedMap.has(this)) {
                throw new TypeError("Expected `this` to be an instance of AbortSignal.");
            }
            return abortedMap.get(this);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AbortSignal, "none", {
        /**
         * Creates a new AbortSignal instance that will never be aborted.
         *
         * @readonly
         */
        get: function () {
            return new AbortSignal();
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Added new "abort" event listener, only support "abort" event.
     *
     * @param _type - Only support "abort" event
     * @param listener - The listener to be added
     */
    AbortSignal.prototype.addEventListener = function (
    // tslint:disable-next-line:variable-name
    _type, listener) {
        if (!listenersMap.has(this)) {
            throw new TypeError("Expected `this` to be an instance of AbortSignal.");
        }
        var listeners = listenersMap.get(this);
        listeners.push(listener);
    };
    /**
     * Remove "abort" event listener, only support "abort" event.
     *
     * @param _type - Only support "abort" event
     * @param listener - The listener to be removed
     */
    AbortSignal.prototype.removeEventListener = function (
    // tslint:disable-next-line:variable-name
    _type, listener) {
        if (!listenersMap.has(this)) {
            throw new TypeError("Expected `this` to be an instance of AbortSignal.");
        }
        var listeners = listenersMap.get(this);
        var index = listeners.indexOf(listener);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    };
    /**
     * Dispatches a synthetic event to the AbortSignal.
     */
    AbortSignal.prototype.dispatchEvent = function (_event) {
        throw new Error("This is a stub dispatchEvent implementation that should not be used.  It only exists for type-checking purposes.");
    };
    return AbortSignal;
}());
export { AbortSignal };
/**
 * Helper to trigger an abort event immediately, the onabort and all abort event listeners will be triggered.
 * Will try to trigger abort event for all linked AbortSignal nodes.
 *
 * - If there is a timeout, the timer will be cancelled.
 * - If aborted is true, nothing will happen.
 *
 * @internal
 */
// eslint-disable-next-line @azure/azure-sdk/ts-use-interface-parameters
export function abortSignal(signal) {
    if (signal.aborted) {
        return;
    }
    if (signal.onabort) {
        signal.onabort.call(signal);
    }
    var listeners = listenersMap.get(signal);
    if (listeners) {
        // Create a copy of listeners so mutations to the array
        // (e.g. via removeListener calls) don't affect the listeners
        // we invoke.
        listeners.slice().forEach(function (listener) {
            listener.call(signal, { type: "abort" });
        });
    }
    abortedMap.set(signal, true);
}
//# sourceMappingURL=AbortSignal.js.map