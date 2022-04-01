"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromStatic = void 0;
const property_provider_1 = require("@aws-sdk/property-provider");
const isFunction = (func) => typeof func === "function";
const fromStatic = (defaultValue) => isFunction(defaultValue) ? async () => await defaultValue() : (0, property_provider_1.fromStatic)(defaultValue);
exports.fromStatic = fromStatic;
