import type { Router } from 'express';
import type { ApiExtensionContext } from './api-extension-context.js';

export type EndpointExtensionContext = ApiExtensionContext & {
	emitter: any;
};

type EndpointConfigFunction = (router: Router, context: EndpointExtensionContext) => void;

type EndpointConfigObject = {
	id: string;
	handler: EndpointConfigFunction;
};

export type EndpointConfig = EndpointConfigFunction | EndpointConfigObject;
