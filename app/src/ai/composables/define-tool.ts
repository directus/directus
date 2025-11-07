import { onMounted, onUnmounted, toValue, unref, watch, type MaybeRefOrGetter } from 'vue';
import { z, ZodObject } from 'zod';
import { useAiStore } from '../stores/use-ai';
import formatTitle from '@directus/format-title';

export interface StaticToolDefinition<T = ZodObject> {
	name: string;
	displayName: string;
	description: string;
	inputSchema: T;
	execute: (args: z.input<T>) => unknown | Promise<unknown>;
}

export interface ToolDefinition<T = ZodObject> {
	name: MaybeRefOrGetter<string>;
	displayName?: MaybeRefOrGetter<string>;
	description: MaybeRefOrGetter<string>;
	inputSchema: MaybeRefOrGetter<T>;
	execute: MaybeRefOrGetter<(args: z.input<T>) => unknown | Promise<unknown>>;
}

export const toStatic = <T>(toolGetter: MaybeRefOrGetter<ToolDefinition<T>>): StaticToolDefinition<T> => {
	const tool = toValue(toolGetter);

	return {
		name: toValue(tool.name),
		displayName: tool.displayName ? toValue(tool.displayName) : formatTitle(toValue(tool.name)),
		description: toValue(tool.description),
		inputSchema: toValue(tool.inputSchema),
		execute: unref(tool.execute),
	};
};

export const defineTool = <T extends ZodObject>(tool: MaybeRefOrGetter<ToolDefinition<T>>) => {
	const aiStore = useAiStore();

	watch(
		() => toValue(tool),
		(newDef, oldDef) => {
			aiStore.replaceLocalTool(toValue(toValue(oldDef).name), toStatic(newDef));
		},
		{ deep: true },
	);

	onMounted(() => {
		aiStore.registerLocalTool(toStatic(tool));
	});

	onUnmounted(() => {
		aiStore.deregisterLocalTool(toStatic(tool).name);
	});
};
