import type { Router } from 'express';
import type { ApiExtensionContext } from './extensions.js';
import type { RouterSecure } from './secure-extensions/router.js';

// --- Endpoint ---

export type EndpointExtensionContext = ApiExtensionContext & {
	emitter: any;
};

type EndpointConfigFunction = (router: Router, context: EndpointExtensionContext) => void;

type EndpointConfigObject = {
	id: string;

	handler: EndpointConfigFunction;
};

export type EndpointConfig = EndpointConfigFunction | EndpointConfigObject;

// --- Secure Endpoint ---

type SecureEndpointConfigFunction = (router: RouterSecure) => void;

type SecureEndpointConfigObject = {
	id: string;

	handler: SecureEndpointConfigFunction;
};

export type SecureEndpointConfig = SecureEndpointConfigFunction | SecureEndpointConfigObject
