import type { Router } from 'express';
import type { ReadStream } from 'node:fs';
import type { Extension } from './app-extension-config.js';

export interface ExtensionManagerOptions {
	schedule: boolean;
	watch: boolean;
}

export type ExtensionManager = {
	readonly extensions: Extension[];
	getExtension: (source: string, folder: string) => Extension | undefined;
	initialize: (options: Partial<ExtensionManagerOptions>) => Promise<void>;
	/**
	 * Installs an external extension from registry
	 */
	install: (versionId: string) => Promise<void>;
	/**
	 * Uninstall an extension
	 */
	uninstall: (folder: string) => Promise<void>;
	broadcastReloadNotification: () => Promise<void>;
	/**
	 * Reload all the extensions. Will unload if extensions have already been loaded
	 */
	reload: (options?: { forceSync: boolean }) => Promise<unknown>;
	/**
	 * Returns a promise we can await while extensions are being reloaded
	 */
	isReloading: () => Promise<void>;
	/**
	 * Return the previously generated app extension bundle chunk by name
	 */
	getAppExtensionChunk: (name?: string) => Promise<ReadStream | null>;
	/**
	 * Return the scoped router for custom endpoints
	 */
	getEndpointRouter: () => Router;
	/**
	 * Return the custom HTML head and body embeds wrapped in a marker comment
	 */
	getEmbeds: () => {
		head: string;
		body: string;
	};
};
