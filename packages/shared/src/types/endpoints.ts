import { Router } from 'express';
import { ApiExtensionContext } from './extensions';

export type EndpointExtensionContext = ApiExtensionContext & {
	emitter: any;
};

type EndpointConfigFunction = (router: Router, context: EndpointExtensionContext) => void;

type EndpointConfigObject = {
	id: string;

	handler: EndpointConfigFunction;
};

export type EndpointConfig = EndpointConfigFunction | EndpointConfigObject;
