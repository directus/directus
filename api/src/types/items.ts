import type { DirectusError } from '@directus/errors';
import type { EventContext, PrimaryKey } from '@directus/types';
import type { MutationTracker } from '../services/items.js';

export type MutationOptions = {
	/**
	 * Callback function that's fired whenever a revision is made in the mutation
	 */
	onRevisionCreate?: ((pk: PrimaryKey) => void) | undefined;

	/**
	 * Flag to disable the auto purging of the cache. Is ignored when CACHE_AUTO_PURGE isn't enabled.
	 */
	autoPurgeCache?: false | undefined;

	/**
	 * Flag to disable the auto purging of the system cache.
	 */
	autoPurgeSystemCache?: false | undefined;

	/**
	 * Allow disabling the emitting of hooks. Useful if a custom hook is fired (like files.upload)
	 */
	emitEvents?: boolean | undefined;

	/**
	 * To bypass the emitting of action events if emitEvents is enabled
	 * Can be used to queue up the nested events from item service's create, update and delete
	 */
	bypassEmitAction?: ((params: ActionEventParams) => void) | undefined;

	/**
	 * To bypass limits so that functions would work as intended
	 */
	bypassLimits?: boolean | undefined;

	/**
	 * To keep track of mutation limits
	 */
	mutationTracker?: MutationTracker | undefined;

	/*
	 * The validation error to throw right before the mutation takes place
	 */
	preMutationError?: DirectusError | undefined;

	bypassAutoIncrementSequenceReset?: boolean;
};

export type ActionEventParams = {
	event: string | string[];
	meta: Record<string, any>;
	context: EventContext;
};
