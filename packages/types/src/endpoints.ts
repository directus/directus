import type { Router } from 'express';
import type { ApiExtensionContext } from './extensions.js';

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

type SecureEndpointConfigFunction = (router: Router) => void;

type SecureEndpointConfigObject = {
	id: string;

	handler: SecureEndpointConfigFunction;
};

export type SecureEndpointConfig = SecureEndpointConfigFunction | SecureEndpointConfigObject
