import type { Component, MaybeRef, Raw, Ref, VNode } from 'vue';
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router';
import type { CommandRouteProps } from './use-command-router';
import { uniqBy } from 'lodash';
import { computed, markRaw, ref, unref, watch } from 'vue';

// Re-export for convenience
export type { CommandRouteProps } from './use-command-router';

// --- Types ---

interface CommandConfigCommon {
	id: string;
	name: string;
	icon: string | (() => VNode);
	render?: () => VNode | VNode[];
	description?: string;
	group?: string;
	keywords?: string[];
	priority?: number;
}

type CommandConfigBefore = CommandConfigCommon & {
	before: string;
	after?: never;
};

type CommandConfigAfter = CommandConfigCommon & {
	before?: never;
	after: string;
};

type CommandConfigBase = CommandConfigCommon | CommandConfigBefore | CommandConfigAfter;

export interface CommandActionContext {
	router: Router;
}

export type CommandConfigWithAction = CommandConfigBase & {
	action: (context: CommandActionContext) => void | Promise<boolean | undefined | void> | boolean | undefined;
	component?: never;
	props?: never;
};

export type CommandConfigWithView = CommandConfigBase & {
	action?: never;
	component: Component;
	props?: CommandRouteProps;
};

export type CommandConfig = CommandConfigWithAction | CommandConfigWithView;

interface GroupConfigBase {
	id: string;
	name: string;
	icon?: string;
}

type GroupConfigBefore = GroupConfigBase & {
	before: string;
	after?: never;
};

type GroupConfigAfter = GroupConfigBase & {
	before?: never;
	after: string;
};

export type GroupConfig = GroupConfigBase | GroupConfigBefore | GroupConfigAfter;

export interface CommandAvailableContext {
	route: RouteLocationNormalizedLoaded;
	search: string;
}

export type CommandsAvailableCallback = (context: CommandAvailableContext) => Promise<CommandConfig[]> | CommandConfig[];
export type GroupsAvailableCallback = (context: CommandAvailableContext) => Promise<GroupConfig[]> | GroupConfig[];

function isCommandConfigBefore(config: CommandConfigBase): config is CommandConfigBefore {
	return 'before' in config;
}

// --- Registry (global state) ---

const groupCallbacks: Ref<GroupsAvailableCallback[]> = ref([]);
const commandCallbacks: Ref<Raw<CommandsAvailableCallback>[]> = ref([]);

// --- Public API ---

export interface RegisterCommandsOptions {
	groups?: GroupConfig[] | GroupsAvailableCallback;
	commands?: CommandConfig[] | CommandsAvailableCallback;
}

export function defineCommands(options: RegisterCommandsOptions): RegisterCommandsOptions {
	return options;
}

export function registerCommands(...options: RegisterCommandsOptions[]) {
	for (const opt of options) {
		const { groups: newGroups = [], commands: newCommands = [] } = opt;

		const commandsCb = markRaw(
			typeof newCommands === 'function' ? newCommands : () => newCommands as CommandConfig[],
		);

		const groupsCb = markRaw(typeof newGroups === 'function' ? newGroups : () => newGroups as GroupConfig[]);

		groupCallbacks.value.push(groupsCb);
		commandCallbacks.value.push(commandsCb);
	}
}

export function useRegisteredCommands(context: MaybeRef<CommandAvailableContext>) {
	const internalCommands: Ref<CommandConfig[]> = ref([]);
	const internalGroups: Ref<GroupConfig[]> = ref([]);

	watch(
		[context, commandCallbacks],
		() => {
			internalCommands.value = collect<CommandConfig>(unref(context), unref(commandCallbacks), (command) =>
				({
					...command,
					...(command.component ? { component: markRaw(command.component) } : {}),
				}) as CommandConfig,
			);
		},
		{ immediate: true },
	);

	watch(
		[context, groupCallbacks],
		() => {
			internalGroups.value = collect(unref(context), unref(groupCallbacks));
		},
		{ immediate: true },
	);

	const sortedCommands = computed(() => {
		const uniqCommands = uniqBy(internalCommands.value, 'id');

		const beforeRegexes = Object.fromEntries(
			uniqCommands.map((command) => [
				command.id,
				isCommandConfigBefore(command) && command.before
					? new RegExp(command.before.replace('*', '.+?'))
					: null,
			]),
		);

		uniqCommands.sort((a, b) => {
			const priorityA = a.priority ?? 0;
			const priorityB = b.priority ?? 0;

			if (priorityA !== priorityB) return priorityB - priorityA;

			if (isCommandConfigBefore(a) && isCommandConfigBefore(b) && a.before === b.before) {
				return 0;
			}

			if (isCommandConfigBefore(a) && a.before) {
				if (a.before === '*') return -1;
				const re = beforeRegexes[a.id]!;
				if (re.test(b.id)) return -1;
			}

			if (isCommandConfigBefore(b) && b.before) {
				if (b.before === '*') return 1;
				const re = beforeRegexes[b.id]!;
				if (re.test(a.id)) return 1;
			}

			return 0;
		});

		return uniqCommands;
	});

	return {
		groups: computed(() => uniqBy(internalGroups.value, 'id')),
		commands: sortedCommands,
	};

	function collect<T>(
		context: CommandAvailableContext,
		callbacks: ((context: CommandAvailableContext) => Promise<T[]> | T[])[],
		transform: (command: T) => T = (c) => c,
	) {
		const result: T[] = [];

		for (const cb of callbacks) {
			const commands = cb(context);

			if (commands instanceof Promise) {
				commands.then((newCommands) => {
					result.push(...newCommands.map(transform));
				});
			} else {
				result.push(...commands.map(transform));
			}
		}

		return result;
	}
}
