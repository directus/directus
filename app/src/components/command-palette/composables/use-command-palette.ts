import type { InjectionKey, Ref } from 'vue';
import type { CommandRouter } from './use-command-router';
import { inject, provide } from 'vue';

export interface CommandPaletteContext {
	search: Ref<string>;
	loading: Ref<boolean>;
	router: CommandRouter;
	close: () => void;
	clearSearch: () => void;
}

const commandPaletteKey: InjectionKey<CommandPaletteContext> = Symbol('CommandPalette');

export function provideCommandPalette(context: CommandPaletteContext) {
	provide(commandPaletteKey, context);
	return context;
}

export function useCommandPalette() {
	const context = inject(commandPaletteKey);

	if (!context) {
		throw new Error('CommandPalette not provided');
	}

	return context;
}
