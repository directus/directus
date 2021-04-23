import { ListenerFn } from 'eventemitter2';
import { Router } from 'express';
import { Knex } from 'knex';
import env from '../env';
import * as exceptions from '../exceptions';
import * as services from '../services';
import { getSchema } from '../utils/get-schema';

export type ApiExtensionType = 'endpoint' | 'hook';
export type AppExtensionType = 'interface' | 'display' | 'layout' | 'module';
export type ExtensionType = ApiExtensionType | AppExtensionType;
export type ExtensionPackageType = ExtensionType | 'pack';

export type ExtensionDir<T extends ExtensionType> = `${T}s`;

export type Extension = {
	path: string;
	name: string;
	version?: string;

	type: ExtensionPackageType;
	entrypoint?: string;
	host?: string;
	children?: string[];

	local: boolean;
	root: boolean;
};

export type ExtensionContext = {
	services: typeof services;
	exceptions: typeof exceptions;
	database: Knex;
	env: typeof env;
	getSchema: typeof getSchema;
};

export type HookRegisterFunction = (context: ExtensionContext) => Record<string, ListenerFn>;
export type EndpointRegisterFunction = (router: Router, context: ExtensionContext) => void;
