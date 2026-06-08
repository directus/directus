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

function hasBefore(config: { before?: string }): config is { before: string } {
	return typeof config.before === 'string';
}

function hasAfter(config: { after?: string }): config is { after: string } {
	return typeof config.after === 'string';
}

function matchesPositionTarget(target: string, id: string) {
	if (target === '*') return true;
	return new RegExp(target.replaceAll('*', '.+?')).test(id);
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
	let commandRequestId = 0;
	let groupRequestId = 0;

	watch(
		[context, commandCallbacks],
		async () => {
			const requestId = ++commandRequestId;
			const commands = await collect<CommandConfig>(unref(context), unref(commandCallbacks), (command) =>
				({
					...command,
					...(command.component ? { component: markRaw(command.component) } : {}),
				}) as CommandConfig,
			);

			if (requestId === commandRequestId) {
				internalCommands.value = commands;
			}
		},
		{ immediate: true },
	);

	watch(
		[context, groupCallbacks],
		async () => {
			const requestId = ++groupRequestId;
			const groups = await collect(unref(context), unref(groupCallbacks));

			if (requestId === groupRequestId) {
				internalGroups.value = groups;
			}
		},
		{ immediate: true },
	);

	const sortedCommands = computed(() => {
		const uniqCommands = uniqBy(internalCommands.value, 'id');
		return sortPositionedConfigs(uniqCommands);
	});

	return {
		groups: computed(() => sortPositionedConfigs(uniqBy(internalGroups.value, 'id'))),
		commands: sortedCommands,
	};

	async function collect<T>(
		context: CommandAvailableContext,
		callbacks: ((context: CommandAvailableContext) => Promise<T[]> | T[])[],
		transform: (command: T) => T = (c) => c,
	) {
		const results = await Promise.all(callbacks.map((cb) => Promise.resolve(cb(context))));
		return results.flatMap((commands) => commands.map(transform));
	}
}

function sortPositionedConfigs<T extends { id: string; before?: string; after?: string; priority?: number }>(
	configs: T[],
) {
	return configs.sort((a, b) => {
		const priorityA = a.priority ?? 0;
		const priorityB = b.priority ?? 0;

		if (priorityA !== priorityB) return priorityB - priorityA;

		if (hasBefore(a) && hasBefore(b) && a.before === b.before) {
			return 0;
		}

		if (hasAfter(a) && hasAfter(b) && a.after === b.after) {
			return 0;
		}

		if (hasBefore(a) && matchesPositionTarget(a.before, b.id)) return -1;
		if (hasAfter(a) && matchesPositionTarget(a.after, b.id)) return 1;
		if (hasBefore(b) && matchesPositionTarget(b.before, a.id)) return 1;
		if (hasAfter(b) && matchesPositionTarget(b.after, a.id)) return -1;

		return 0;
	});
}
