import type { Component, DeepReadonly, InjectionKey, Ref } from 'vue';
import { computed, inject, markRaw, provide, readonly, ref } from 'vue';

export type CommandRoutePropFunction = (to: NamedCommandLocation) => Record<string, any>;
export type CommandRouteProps = Record<string, any> | CommandRoutePropFunction;

export interface CommandLocationRaw {
	component: Component;
	props?: CommandRouteProps;
}

export type NamedCommandLocation = CommandLocationRaw & {
	name: string;
};

export type CommandLocation = CommandLocationRaw | NamedCommandLocation;

interface StackRoute {
	name: string;
	component: Component;
	props?: CommandRouteProps;
}

export interface CommandRouterOptions {
	root: Component;
	rootProps?: Record<string, any>;
}

export interface CommandRouter {
	stack: DeepReadonly<Ref<StackRoute[]>>;
	currentCommand: Ref<NamedCommandLocation>;
	push: (location: CommandLocation) => void;
	pop: () => boolean;
	clear: () => void;
}

const commandRouterKey: InjectionKey<CommandRouter> = Symbol('CommandRouter');

export function createCommandRouter(options: CommandRouterOptions): CommandRouter {
	const stack: Ref<StackRoute[]> = ref([]);

	const currentCommand: Ref<NamedCommandLocation> = computed(() => stack.value.at(-1) as NamedCommandLocation);

	stack.value.push({
		name: '$root',
		component: markRaw(options.root),
		props: options.rootProps,
	});

	function push(location: CommandLocation) {
		const name = 'name' in location ? location.name : (location.component.name ?? 'unnamed');

		stack.value.push({
			name,
			component: markRaw(location.component),
			props: location.props,
		});
	}

	function pop() {
		if (stack.value.length === 1) return false;
		return !!stack.value.pop();
	}

	function clear() {
		stack.value = [stack.value[0]!];
	}

	return {
		stack: readonly(stack),
		currentCommand,
		push,
		pop,
		clear,
	};
}

export function provideCommandRouter(router: CommandRouter) {
	provide(commandRouterKey, router);
}

export function useCommandRouter() {
	const router = inject(commandRouterKey);

	if (!router) {
		throw new Error('No CommandRouter provided');
	}

	return router;
}
