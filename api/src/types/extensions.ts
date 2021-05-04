import { ListenerFn } from 'eventemitter2';
import { Router } from 'express';
import { Knex } from 'knex';
import env from '../env';
import * as exceptions from '../exceptions';
import * as services from '../services';
import { getSchema } from '../utils/get-schema';

export type ExtensionContext = {
	services: typeof services;
	exceptions: typeof exceptions;
	database: Knex;
	env: typeof env;
	getSchema: typeof getSchema;
};

export type HookRegisterFunction = (context: ExtensionContext) => Record<string, ListenerFn>;
export type EndpointRegisterFunction = (router: Router, context: ExtensionContext) => void;
