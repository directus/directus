import { ListenerFn } from 'eventemitter2';
import { Router } from 'express';
import { Knex } from 'knex';
import { Logger } from 'pino';
import env from '../env';
import * as exceptions from '../exceptions';
import * as services from '../services';
import { getSchema } from '../utils/get-schema';

export type ExtensionContext = {
	services: typeof services;
	exceptions: typeof exceptions;
	database: Knex;
	env: typeof env;
	logger: Logger;
	getSchema: typeof getSchema;
};

type HookHandlerFunction = (context: ExtensionContext) => Record<string, ListenerFn>;

export type HookConfig = HookHandlerFunction;

type EndpointHandlerFunction = (router: Router, context: ExtensionContext) => void;
interface EndpointAdvancedConfig {
	id: string;
	handler: EndpointHandlerFunction;
}

export type EndpointConfig = EndpointHandlerFunction | EndpointAdvancedConfig;
