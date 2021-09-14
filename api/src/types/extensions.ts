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

type FilterFunction = (event: string, handler: (...values: any[]) => any[]) => void;
type ActionFunction = (event: string, handler: (...values: any[]) => void) => void;
type InitFunction = (event: string, handler: (...values: any[]) => void) => void;
type ScheduleFunction = (cron: string, handler: () => void) => void;

type RegisterFunctions = {
	filter: FilterFunction;
	action: ActionFunction;
	init: InitFunction;
	schedule: ScheduleFunction;
};

type HookHandlerFunction = (register: RegisterFunctions, context: ExtensionContext) => void;

export type HookConfig = HookHandlerFunction;

type EndpointHandlerFunction = (router: Router, context: ExtensionContext) => void;
interface EndpointAdvancedConfig {
	id: string;
	handler: EndpointHandlerFunction;
}

export type EndpointConfig = EndpointHandlerFunction | EndpointAdvancedConfig;
