import {
	newQuickJSWASMModuleFromVariant,
	newVariant,
	RELEASE_SYNC,
	type QuickJSContext,
	type QuickJSHandle,
	type QuickJSRuntime,
} from 'quickjs-emscripten';
import wasmLocation from '@jitl/quickjs-wasmfile-release-sync/wasm?url';
import { reactive } from 'vue';
import type { SafeSDK } from './safe-sdk';

export interface SandboxConfig {
	timeoutMs?: number;
	maxTimers?: number;
	minIntervalMs?: number;
}

export interface LogEntry {
	level: 'log' | 'info' | 'warn' | 'error' | 'debug';
	message: string;
	timestamp: number;
}

export interface ErrorEntry {
	message: string;
	action?: string;
	timestamp: number;
}

export interface SandboxResult {
	state: Record<string, unknown>;
	actions: Record<string, (...args: unknown[]) => Promise<unknown>>;
	error: Error | null;
	logs: LogEntry[];
	errors: ErrorEntry[];
	dispose: () => void;
}

// Setup the modular variant
const variant = newVariant(RELEASE_SYNC, {
	wasmLocation,
});

let quickJSPromise: ReturnType<typeof newQuickJSWASMModuleFromVariant> | null = null;

// Singleton QuickJS module - load once, reuse
function getQuickJS() {
	if (!quickJSPromise) {
		quickJSPromise = newQuickJSWASMModuleFromVariant(variant);
	}

	return quickJSPromise;
}

// Default config values
const DEFAULT_MAX_TIMERS = 50;
const DEFAULT_MIN_INTERVAL_MS = 50;

export async function createQuickJSSandbox(
	script: string | null,
	sdk: SafeSDK,
	config?: SandboxConfig,
): Promise<SandboxResult> {
	const state = reactive<Record<string, unknown>>({});
	const actions: Record<string, (...args: unknown[]) => Promise<unknown>> = {};
	let error: Error | null = null;
	const logs: LogEntry[] = [];
	const errors: ErrorEntry[] = [];
	let runtime: QuickJSRuntime | null = null;
	let context: QuickJSContext | null = null;

	// Timer tracking
	const maxTimers = config?.maxTimers ?? DEFAULT_MAX_TIMERS;
	const minIntervalMs = config?.minIntervalMs ?? DEFAULT_MIN_INTERVAL_MS;
	const activeTimers = new Map<number, ReturnType<typeof setTimeout>>();

	// Lifecycle management for async operations
	let pendingOps = 0;
	let disposeRequested = false;
	let disposed = false;

	const actuallyDispose = () => {
		if (disposed) return;
		disposed = true;

		// Clear all active timers
		for (const timer of activeTimers.values()) {
			clearTimeout(timer);
		}

		activeTimers.clear();

		if (context) {
			try {
				// Execute any remaining pending jobs before disposal
				runtime?.executePendingJobs();
				context.dispose();
			} catch {
				// Ignore disposal errors
			}

			context = null;
		}

		if (runtime) {
			try {
				runtime.dispose();
			} catch {
				// Ignore disposal errors
			}

			runtime = null;
		}
	};

	const dispose = () => {
		if (disposed) return;

		if (pendingOps > 0) {
			// Defer disposal until all async operations complete
			disposeRequested = true;
		} else {
			actuallyDispose();
		}
	};

	if (!script || !script.trim()) {
		return { state, actions, error, logs, errors, dispose };
	}

	try {
		const QuickJS = await getQuickJS();
		runtime = QuickJS.newRuntime();
		context = runtime.newContext();

		// Setup console with log capture
		const consoleHandle = context.newObject();

		for (const method of ['log', 'info', 'warn', 'error', 'debug'] as const) {
			const fn = context.newFunction(method, (...args: QuickJSHandle[]) => {
				const jsArgs = args.map((a) => context!.dump(a));
				const message = jsArgs.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');

				// Capture to logs array (limit to last 100 entries)
				logs.push({ level: method, message, timestamp: Date.now() });

				if (logs.length > 100) {
					logs.shift();
				}

				// Also forward to browser console
				// eslint-disable-next-line no-console
				console[method]('[Mini-App]', ...jsArgs);
			});

			context.setProp(consoleHandle, method, fn);
			fn.dispose();
		}

		context.setProp(context.global, 'console', consoleHandle);
		consoleHandle.dispose();

		// Setup state object
		const stateHandle = context.newObject();
		context.setProp(context.global, 'state', stateHandle);
		stateHandle.dispose();

		// Setup actions object
		const actionsHandle = context.newObject();
		context.setProp(context.global, 'actions', actionsHandle);
		actionsHandle.dispose();

		// Setup SDK functions as async host functions
		setupSDKFunctions(context, sdk);

		// Setup timer functions (setTimeout, setInterval, etc.)
		setupTimerFunctions(context, state, logs, errors, activeTimers, maxTimers, minIntervalMs, () => disposed);

		// Execute user script
		const result = context.evalCode(`(function(){"use strict";${script}})()`);

		if (result.error) {
			const err = context.dump(result.error);
			result.error.dispose();
			throw new Error(String(err));
		}

		result.value.dispose();

		// Extract initial state
		syncStateFromVM(context, state);

		// Extract action names and create wrappers
		const keysResult = context.evalCode('Object.keys(actions)');

		if (!keysResult.error) {
			const keys = context.dump(keysResult.value) as string[];
			keysResult.value.dispose();

			for (const key of keys) {
				actions[key] = createActionWrapper(
					key,
					context,
					runtime,
					state,
					errors,
					(delta: number) => {
						pendingOps += delta;

						if (disposeRequested && pendingOps === 0) {
							actuallyDispose();
						}
					},
					() => disposed,
				);
			}
		} else {
			const err = context.dump(keysResult.error);
			// eslint-disable-next-line no-console
			console.error('[Mini-App] Failed to extract actions:', err);
			keysResult.error.dispose();
		}

		// Call init if exists
		if (actions['init']) {
			actions['init']().catch((e) => {
				const errMessage = e instanceof Error ? e.message : String(e);
				errors.push({ message: errMessage, action: 'init', timestamp: Date.now() });
				// eslint-disable-next-line no-console
				console.error('[Mini-App] Init error:', e);
			});
		}
	} catch (err) {
		error = err as Error;
		errors.push({ message: error.message, timestamp: Date.now() });
		// eslint-disable-next-line no-console
		console.error('[Mini-App Sandbox Error]', err);
	}

	return { state, actions, error, logs, errors, dispose };
}

/**
 * Creates an action wrapper that properly handles async execution
 */
function createActionWrapper(
	actionName: string,
	context: QuickJSContext,
	runtime: QuickJSRuntime,
	state: Record<string, unknown>,
	errors: ErrorEntry[],
	updatePendingOps: (delta: number) => void,
	isDisposed: () => boolean,
): (...args: unknown[]) => Promise<unknown> {
	return async (...args: unknown[]) => {
		if (isDisposed()) {
			throw new Error('Sandbox has been disposed');
		}

		updatePendingOps(1);

		try {
			// Call action in QuickJS
			const callResult = context.evalCode(
				`(function(){
					const fn = actions["${actionName}"];
					if (typeof fn === 'function') {
						const result = fn(...${JSON.stringify(args)});
						// Check if result is a promise
						if (result && typeof result.then === 'function') {
							return { __isPromise: true, promise: result };
						}
						return JSON.stringify({ok: true, result: result});
					}
					return JSON.stringify({ok: false, error: "Not a function"});
				})()`,
			);

			if (callResult.error) {
				const err = context.dump(callResult.error);
				callResult.error.dispose();
				throw new Error(String(err));
			}

			// Check if the result indicates an async operation
			const rawResult = context.dump(callResult.value);

			if (rawResult && typeof rawResult === 'object' && rawResult.__isPromise) {
				// It's a promise - we need to resolve it
				const promiseHandle = context.getProp(callResult.value, 'promise');
				callResult.value.dispose();

				// Pump event loop first
				runtime.executePendingJobs();

				// Resolve the promise
				const promiseResult = await context.resolvePromise(promiseHandle);
				promiseHandle.dispose();

				if (promiseResult.error) {
					const err = context.dump(promiseResult.error);
					promiseResult.error.dispose();
					throw new Error(String(err));
				}

				const asyncResult = context.dump(promiseResult.value);
				promiseResult.value.dispose();

				// Re-sync state after async action
				syncStateFromVM(context, state);

				return asyncResult;
			}

			// Sync result
			callResult.value.dispose();

			// Execute any pending jobs that may have been queued
			runtime.executePendingJobs();

			// Re-sync state after action
			syncStateFromVM(context, state);

			if (typeof rawResult === 'string') {
				const parsed = JSON.parse(rawResult);
				if (!parsed.ok) throw new Error(parsed.error);
				return parsed.result;
			}
		} catch (err) {
			// Capture error to errors array
			const errMessage = err instanceof Error ? err.message : String(err);
			errors.push({ message: errMessage, action: actionName, timestamp: Date.now() });

			// Re-throw so caller can handle it
			throw err;
		} finally {
			updatePendingOps(-1);
		}
	};
}

/**
 * Syncs state from QuickJS VM to Vue reactive state
 */
function syncStateFromVM(context: QuickJSContext, state: Record<string, unknown>) {
	const stateResult = context.evalCode('JSON.stringify(state)');

	if (!stateResult.error) {
		const stateJson = context.dump(stateResult.value);
		stateResult.value.dispose();

		if (typeof stateJson === 'string') {
			const newState = JSON.parse(stateJson);

			// Remove keys that no longer exist
			for (const k of Object.keys(state)) {
				if (!(k in newState)) delete state[k];
			}

			// Update/add keys
			Object.assign(state, newState);
		}
	} else {
		stateResult.error.dispose();
	}
}

/**
 * Sets up SDK functions as async host functions in QuickJS
 */
function setupSDKFunctions(context: QuickJSContext, sdk: SafeSDK) {
	const sdkMethods = [
		{ name: 'readItems', fn: sdk.readItems.bind(sdk) },
		{ name: 'readItem', fn: sdk.readItem.bind(sdk) },
		{ name: 'createItem', fn: sdk.createItem.bind(sdk) },
		{ name: 'updateItem', fn: sdk.updateItem.bind(sdk) },
		{ name: 'deleteItem', fn: sdk.deleteItem.bind(sdk) },
	];

	for (const { name, fn } of sdkMethods) {
		const hostFn = context.newFunction(name, (...argHandles: QuickJSHandle[]) => {
			const args = argHandles.map((h) => context.dump(h));

			// Create a promise that will be resolved by the host
			const promise = context.newPromise();

			// Execute the SDK function asynchronously
			(fn as any)(...args)
				.then((result: unknown) => {
					if (context) {
						const resultHandle = jsonToHandle(context, result);
						promise.resolve(resultHandle);
						resultHandle.dispose();
					}
				})
				.catch((err: any) => {
					if (context) {
						const errorHandle = context.newString(err instanceof Error ? err.message : String(err));
						promise.reject(errorHandle);
						errorHandle.dispose();
					}
				});

			// Important: tell QuickJS to execute pending jobs when the promise settles
			promise.settled.then(() => {
				if (context) {
					context.runtime.executePendingJobs();
				}
			});

			return promise.handle;
		});

		context.setProp(context.global, name, hostFn);
		hostFn.dispose();
	}

	// Also set up sdk.request
	const requestFn = context.newFunction('request', (...argHandles: QuickJSHandle[]) => {
		const args = argHandles.map((h) => context.dump(h));
		const [path, options] = args as [string, Record<string, unknown> | undefined];

		const promise = context.newPromise();

		sdk
			.request(path, options)
			.then((result) => {
				if (context) {
					const resultHandle = jsonToHandle(context, result);
					promise.resolve(resultHandle);
					resultHandle.dispose();
				}
			})
			.catch((err) => {
				if (context) {
					const errorHandle = context.newString(err instanceof Error ? err.message : String(err));
					promise.reject(errorHandle);
					errorHandle.dispose();
				}
			});

		promise.settled.then(() => {
			if (context) {
				context.runtime.executePendingJobs();
			}
		});

		return promise.handle;
	});

	// Create sdk object and attach request
	const sdkObj = context.newObject();
	context.setProp(sdkObj, 'request', requestFn);
	context.setProp(context.global, 'sdk', sdkObj);

	// Also expose request globally to match other SDK functions
	context.setProp(context.global, 'request', requestFn);

	requestFn.dispose();
	sdkObj.dispose();
}

/**
 * Converts a JavaScript value to a QuickJS handle
 */
function jsonToHandle(context: QuickJSContext, value: unknown): QuickJSHandle {
	if (value === null || value === undefined) {
		return context.undefined;
	}

	if (typeof value === 'boolean') {
		return value ? context.true : context.false;
	}

	if (typeof value === 'number') {
		return context.newNumber(value);
	}

	if (typeof value === 'string') {
		return context.newString(value);
	}

	if (Array.isArray(value)) {
		const arr = context.newArray();

		for (let i = 0; i < value.length; i++) {
			const itemHandle = jsonToHandle(context, value[i]);
			context.setProp(arr, i, itemHandle);
			itemHandle.dispose();
		}

		return arr;
	}

	if (typeof value === 'object') {
		const obj = context.newObject();

		for (const [key, val] of Object.entries(value)) {
			const valHandle = jsonToHandle(context, val);
			context.setProp(obj, key, valHandle);
			valHandle.dispose();
		}

		return obj;
	}

	// Fallback: stringify
	return context.newString(JSON.stringify(value));
}

/**
 * Sets up timer functions (setTimeout, setInterval, clearTimeout, clearInterval) in QuickJS
 */
function setupTimerFunctions(
	context: QuickJSContext,
	state: Record<string, unknown>,
	logs: LogEntry[],
	errors: ErrorEntry[],
	activeTimers: Map<number, ReturnType<typeof setTimeout>>,
	maxTimers: number,
	minIntervalMs: number,
	isDisposed: () => boolean,
) {
	// Helper to execute callback and sync state
	const executeCallback = (callbackCode: string, timerId: number, isInterval: boolean) => {
		if (isDisposed()) return;

		try {
			const result = context.evalCode(callbackCode);

			if (result.error) {
				const err = context.dump(result.error);
				result.error.dispose();
				errors.push({ message: String(err), action: `timer-${timerId}`, timestamp: Date.now() });
			} else {
				result.value.dispose();
			}

			// Sync state after callback
			syncStateFromVM(context, state);

			// Execute pending jobs
			context.runtime.executePendingJobs();
		} catch (err) {
			const errMessage = err instanceof Error ? err.message : String(err);
			errors.push({ message: errMessage, action: `timer-${timerId}`, timestamp: Date.now() });
		}

		// Clean up non-interval timers
		if (!isInterval) {
			activeTimers.delete(timerId);
		}
	};

	// setTimeout
	const setTimeoutFn = context.newFunction('setTimeout', (...args: QuickJSHandle[]) => {
		if (activeTimers.size >= maxTimers) {
			logs.push({
				level: 'warn',
				message: `Max timers (${maxTimers}) reached, setTimeout ignored`,
				timestamp: Date.now(),
			});

			return context.newNumber(-1);
		}

		const callback = args[0];

		if (!callback) {
			return context.newNumber(-1);
		}

		const delay = args[1] ? context.dump(args[1]) : 0;
		const delayMs = Math.max(0, Number(delay) || 0);

		if (context.typeof(callback) === 'function') {
			// Store function reference for later execution
			const timerId = nextTimerId++;
			const callbackName = `__timeout_cb_${timerId}`;
			context.setProp(context.global, callbackName, callback);
			const callbackCode = `${callbackName}(); delete globalThis.${callbackName};`;

			const timer = setTimeout(() => {
				executeCallback(callbackCode, timerId, false);
			}, delayMs);

			activeTimers.set(timerId, timer);
			return context.newNumber(timerId);
		}

		return context.newNumber(-1);
	});

	context.setProp(context.global, 'setTimeout', setTimeoutFn);
	setTimeoutFn.dispose();

	// clearTimeout
	const clearTimeoutFn = context.newFunction('clearTimeout', (...args: QuickJSHandle[]) => {
		const timerId = args[0] ? (context.dump(args[0]) as number) : -1;
		const timer = activeTimers.get(timerId);

		if (timer) {
			clearTimeout(timer);
			activeTimers.delete(timerId);
		}

		return context.undefined;
	});

	context.setProp(context.global, 'clearTimeout', clearTimeoutFn);
	clearTimeoutFn.dispose();

	// setInterval
	const setIntervalFn = context.newFunction('setInterval', (...args: QuickJSHandle[]) => {
		if (activeTimers.size >= maxTimers) {
			logs.push({
				level: 'warn',
				message: `Max timers (${maxTimers}) reached, setInterval ignored`,
				timestamp: Date.now(),
			});

			return context.newNumber(-1);
		}

		const callback = args[0];

		if (!callback) {
			return context.newNumber(-1);
		}

		const interval = args[1] ? context.dump(args[1]) : minIntervalMs;
		const intervalMs = Math.max(minIntervalMs, Number(interval) || minIntervalMs);

		if (context.typeof(callback) === 'function') {
			const timerId = nextTimerId++;
			const callbackName = `__interval_cb_${timerId}`;
			context.setProp(context.global, callbackName, callback);
			const callbackCode = `${callbackName}();`;

			const timer = setInterval(() => {
				executeCallback(callbackCode, timerId, true);
			}, intervalMs);

			activeTimers.set(timerId, timer);
			return context.newNumber(timerId);
		}

		return context.newNumber(-1);
	});

	context.setProp(context.global, 'setInterval', setIntervalFn);
	setIntervalFn.dispose();

	// clearInterval (same as clearTimeout internally)
	const clearIntervalFn = context.newFunction('clearInterval', (...args: QuickJSHandle[]) => {
		const timerId = args[0] ? (context.dump(args[0]) as number) : -1;
		const timer = activeTimers.get(timerId);

		if (timer) {
			clearInterval(timer);
			activeTimers.delete(timerId);

			// Also clean up the stored callback
			context.evalCode(`delete globalThis.__interval_cb_${timerId};`);
		}

		return context.undefined;
	});

	context.setProp(context.global, 'clearInterval', clearIntervalFn);
	clearIntervalFn.dispose();
}

// Track next timer ID globally for the module (shared across sandbox instances)
let nextTimerId = 1;
