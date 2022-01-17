import { Accountability } from '@directus/shared/types';
import { Router } from 'express';
import { Knex } from 'knex';
import { Logger } from 'pino';
import env from '../env';
import * as exceptions from '../exceptions';
import * as services from '../services';
import { Emitter } from '../emitter';
import { getSchema } from '../utils/get-schema';
import { SchemaOverview } from './schema';

export type ExtensionContext = {
	services: typeof services;
	exceptions: typeof exceptions;
	database: Knex;
	env: typeof env;
	emitter: Emitter;
	logger: Logger;
	getSchema: typeof getSchema;
};

export type HookContext = {
	database: Knex;
	schema: SchemaOverview | null;
	accountability: Accountability | null;
};

export type FilterHandler = (payload: any, meta: Record<string, any>, context: HookContext) => any | Promise<any>;
export type ActionHandler = (meta: Record<string, any>, context: HookContext) => void;
export type InitHandler = (meta: Record<string, any>) => void;
export type ScheduleHandler = () => void;

type RegisterFunctions = {
	filter: (event: string, handler: FilterHandler) => void;
	action: (event: string, handler: ActionHandler) => void;
	init: (event: string, handler: InitHandler) => void;
	schedule: (cron: string, handler: ScheduleHandler) => void;
};

type HookConfigFunction = (register: RegisterFunctions, context: ExtensionContext) => void;

export type HookConfig = HookConfigFunction;

type EndpointConfigFunction = (router: Router, context: ExtensionContext) => void;
type EndpointConfigObject = {
	id: string;
	handler: EndpointConfigFunction;
};

export type EndpointConfig = EndpointConfigFunction | EndpointConfigObject;
