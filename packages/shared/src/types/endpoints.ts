import { Router } from 'express';
import { HookEndpointExtensionContext } from './extensions';

type EndpointConfigFunction = (router: Router, context: HookEndpointExtensionContext) => void;
type EndpointConfigObject = {
	id: string;
	handler: EndpointConfigFunction;
};

export type EndpointConfig = EndpointConfigFunction | EndpointConfigObject;
