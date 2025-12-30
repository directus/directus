import type { ApiExtensionContext } from './api-extension-context.js';
import type { Router } from 'express';

export type EndpointExtensionContext = ApiExtensionContext & {
	emitter: any;
};

type EndpointConfigFunction = (router: Router, context: EndpointExtensionContext) => void;

type EndpointConfigObject = {
	id: string;
	handler: EndpointConfigFunction;
};

export type EndpointConfig = EndpointConfigFunction | EndpointConfigObject;
