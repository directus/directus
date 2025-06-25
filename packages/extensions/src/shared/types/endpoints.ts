import type { Router } from 'express';
import type { ApiExtensionContext } from './api-extension-context.js';
import type { Emitter } from '@directus/types';

export type EndpointExtensionContext = ApiExtensionContext & {
	emitter: Emitter;
};

type EndpointConfigFunction = (router: Router, context: EndpointExtensionContext) => void;

type EndpointConfigObject = {
	id: string;
	handler: EndpointConfigFunction;
};

export type EndpointConfig = EndpointConfigFunction | EndpointConfigObject;
