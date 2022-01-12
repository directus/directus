import { Router } from 'express';
import { ApiExtensionContext } from './extensions';

type EndpointConfigFunction = (router: Router, context: ApiExtensionContext) => void;
type EndpointConfigObject = {
	id: string;
	handler: EndpointConfigFunction;
};

export type EndpointConfig = EndpointConfigFunction | EndpointConfigObject;
