'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * A static-key-based credential that supports updating
 * the underlying key value.
 */
class AzureKeyCredential {
    /**
     * Create an instance of an AzureKeyCredential for use
     * with a service client.
     *
     * @param key - The initial value of the key to use in authentication
     */
    constructor(key) {
        if (!key) {
            throw new Error("key must be a non-empty string");
        }
        this._key = key;
    }
    /**
     * The value of the key to be used in authentication
     */
    get key() {
        return this._key;
    }
    /**
     * Change the value of the key.
     *
     * Updates will take effect upon the next request after
     * updating the key value.
     *
     * @param newKey - The new key value to be used
     */
    update(newKey) {
        this._key = newKey;
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * Helper TypeGuard that checks if something is defined or not.
 * @param thing - Anything
 * @internal
 */
function isDefined(thing) {
    return typeof thing !== "undefined" && thing !== null;
}
/**
 * Helper TypeGuard that checks if the input is an object with the specified properties.
 * Note: The properties may be inherited.
 * @param thing - Anything.
 * @param properties - The name of the properties that should appear in the object.
 * @internal
 */
function isObjectWithProperties(thing, properties) {
    if (!isDefined(thing) || typeof thing !== "object") {
        return false;
    }
    for (const property of properties) {
        if (!objectHasProperty(thing, property)) {
            return false;
        }
    }
    return true;
}
/**
 * Helper TypeGuard that checks if the input is an object with the specified property.
 * Note: The property may be inherited.
 * @param thing - Any object.
 * @param property - The name of the property that should appear in the object.
 * @internal
 */
function objectHasProperty(thing, property) {
    return typeof thing === "object" && property in thing;
}

// Copyright (c) Microsoft Corporation.
/**
 * A static name/key-based credential that supports updating
 * the underlying name and key values.
 */
class AzureNamedKeyCredential {
    /**
     * Create an instance of an AzureNamedKeyCredential for use
     * with a service client.
     *
     * @param name - The initial value of the name to use in authentication.
     * @param key - The initial value of the key to use in authentication.
     */
    constructor(name, key) {
        if (!name || !key) {
            throw new TypeError("name and key must be non-empty strings");
        }
        this._name = name;
        this._key = key;
    }
    /**
     * The value of the key to be used in authentication.
     */
    get key() {
        return this._key;
    }
    /**
     * The value of the name to be used in authentication.
     */
    get name() {
        return this._name;
    }
    /**
     * Change the value of the key.
     *
     * Updates will take effect upon the next request after
     * updating the key value.
     *
     * @param newName - The new name value to be used.
     * @param newKey - The new key value to be used.
     */
    update(newName, newKey) {
        if (!newName || !newKey) {
            throw new TypeError("newName and newKey must be non-empty strings");
        }
        this._name = newName;
        this._key = newKey;
    }
}
/**
 * Tests an object to determine whether it implements NamedKeyCredential.
 *
 * @param credential - The assumed NamedKeyCredential to be tested.
 */
function isNamedKeyCredential(credential) {
    return (isObjectWithProperties(credential, ["name", "key"]) &&
        typeof credential.key === "string" &&
        typeof credential.name === "string");
}

// Copyright (c) Microsoft Corporation.
/**
 * A static-signature-based credential that supports updating
 * the underlying signature value.
 */
class AzureSASCredential {
    /**
     * Create an instance of an AzureSASCredential for use
     * with a service client.
     *
     * @param signature - The initial value of the shared access signature to use in authentication
     */
    constructor(signature) {
        if (!signature) {
            throw new Error("shared access signature must be a non-empty string");
        }
        this._signature = signature;
    }
    /**
     * The value of the shared access signature to be used in authentication
     */
    get signature() {
        return this._signature;
    }
    /**
     * Change the value of the signature.
     *
     * Updates will take effect upon the next request after
     * updating the signature value.
     *
     * @param newSignature - The new shared access signature value to be used
     */
    update(newSignature) {
        if (!newSignature) {
            throw new Error("shared access signature must be a non-empty string");
        }
        this._signature = newSignature;
    }
}
/**
 * Tests an object to determine whether it implements SASCredential.
 *
 * @param credential - The assumed SASCredential to be tested.
 */
function isSASCredential(credential) {
    return (isObjectWithProperties(credential, ["signature"]) && typeof credential.signature === "string");
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * Tests an object to determine whether it implements TokenCredential.
 *
 * @param credential - The assumed TokenCredential to be tested.
 */
function isTokenCredential(credential) {
    // Check for an object with a 'getToken' function and possibly with
    // a 'signRequest' function.  We do this check to make sure that
    // a ServiceClientCredentials implementor (like TokenClientCredentials
    // in ms-rest-nodeauth) doesn't get mistaken for a TokenCredential if
    // it doesn't actually implement TokenCredential also.
    const castCredential = credential;
    return (castCredential &&
        typeof castCredential.getToken === "function" &&
        (castCredential.signRequest === undefined || castCredential.getToken.length > 0));
}

exports.AzureKeyCredential = AzureKeyCredential;
exports.AzureNamedKeyCredential = AzureNamedKeyCredential;
exports.AzureSASCredential = AzureSASCredential;
exports.isNamedKeyCredential = isNamedKeyCredential;
exports.isSASCredential = isSASCredential;
exports.isTokenCredential = isTokenCredential;
//# sourceMappingURL=index.js.map
