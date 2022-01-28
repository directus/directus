import { Router } from 'express';
import { ApiExtensionContext } from './extensions';

type EndpointExtensionContext = ApiExtensionContext & {
	emitter: any;
};

type EndpointConfigFunction = (router: Router, context: EndpointExtensionContext) => void;

type EndpointConfigObject = {
	id: string;
	handler: EndpointConfigFunction;
};

export type EndpointConfig = EndpointConfigFunction | EndpointConfigObject;
