import { Accountability } from '@directus/shared/types';
import { Router } from 'express';
import { Knex } from 'knex';
import { Logger } from 'pino';
import env from '../env';
import * as exceptions from '../exceptions';
import * as services from '../services';
import { getSchema } from '../utils/get-schema';
import { SchemaOverview } from './schema';

export type ExtensionContext = {
	services: typeof services;
	exceptions: typeof exceptions;
	database: Knex;
	env: typeof env;
	logger: Logger;
	getSchema: typeof getSchema;
};

export type HookContext = {
	database: Knex;
	schema: SchemaOverview | null;
	accountability: Accountability | null;
};

export type FilterHandler = (payload: any, meta: Record<string, any>, context: HookContext) => any | Promise<any>;
export type ActionHandler = (meta: Record<string, any>, context: HookContext) => void | Promise<void>;
export type InitHandler = (meta: Record<string, any>) => void | Promise<void>;
export type ScheduleHandler = () => void | Promise<void>;

type RegisterFunctions = {
	filter: (event: string, handler: FilterHandler) => void;
	action: (event: string, handler: ActionHandler) => void;
	init: (event: string, handler: InitHandler) => void;
	schedule: (cron: string, handler: ScheduleHandler) => void;
};

type HookHandlerFunction = (register: RegisterFunctions, context: ExtensionContext) => void;

export type HookConfig = HookHandlerFunction;

type EndpointHandlerFunction = (router: Router, context: ExtensionContext) => void;
interface EndpointAdvancedConfig {
	id: string;
	handler: EndpointHandlerFunction;
}

export type EndpointConfig = EndpointHandlerFunction | EndpointAdvancedConfig;
