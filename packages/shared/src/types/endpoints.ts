import { Router } from 'express';
import { ApiExtensionContext } from './extensions';

type EndpointHandlerFunction = (router: Router, context: ApiExtensionContext) => void;
interface EndpointAdvancedConfig {
	id: string;
	handler: EndpointHandlerFunction;
}

export type EndpointConfig = EndpointHandlerFunction | EndpointAdvancedConfig;
