import type { EventContext } from './events.js';
import type { UserIntegrityCheckFlag } from './users.js';
import type { PermissionsAction } from './permissions.js';
import type { DirectusError } from './error.js';

export type Item = Record<string, any>;

export type PrimaryKey = string | number;

export type Alterations<T extends Item = Item, K extends keyof T | undefined = undefined> = {
	create: Partial<T>[];
	update: (K extends keyof T ? Partial<T> & Pick<T, K> : Partial<T>)[];
	delete: (K extends keyof T ? T[K] : PrimaryKey)[];
};

export type ActionEventParams = {
	event: string | string[];
	meta: Record<string, any>;
	context: EventContext;
};

export type MutationTracker = {
	trackMutations: (count: number) => void;
	getCount: () => number;
};

export type QueryOptions = {
	stripNonRequested?: boolean;
	permissionsAction?: PermissionsAction;
	emitEvents?: boolean;
};

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

	/**
	 * Indicate that the top level mutation needs to perform a user integrity check before commiting the transaction
	 * This is a combination of flags
	 * @see UserIntegrityCheckFlag
	 */
	userIntegrityCheckFlags?: UserIntegrityCheckFlag;

	/**
	 * Callback function that is called whenever a mutation requires a user integrity check to be made
	 */
	onRequireUserIntegrityCheck?: ((flags: UserIntegrityCheckFlag) => void) | undefined;
};
