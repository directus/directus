import type { ReferenceElement } from 'reka-ui';
import { reactive } from 'vue';

export const TOOLTIP_CONTENT_ID = 'app-tooltip-content';

export type TooltipSide = 'top' | 'bottom' | 'left' | 'right';
export type TooltipAlign = 'start' | 'center' | 'end';

export interface TooltipPayload {
	content: string;
	kbd?: string[];
	side: TooltipSide;
	align: TooltipAlign;
	inverted: boolean;
	monospace: boolean;
	delayDuration: number;
	virtualRef: ReferenceElement | null;
}

interface TooltipState extends Omit<TooltipPayload, 'delayDuration'> {
	open: boolean;
}

const state = reactive<TooltipState>({
	open: false,
	content: '',
	kbd: undefined,
	side: 'top',
	align: 'center',
	inverted: false,
	monospace: false,
	virtualRef: null,
});

let timer: ReturnType<typeof setTimeout> | null = null;

function openTooltip(payload: TooltipPayload, immediateContent = false): void {
	if (timer) clearTimeout(timer);

	if (immediateContent) state.content = payload.content;

	timer = setTimeout(() => {
		const { delayDuration: _, kbd, ...rest } = payload;
		Object.assign(state, rest);
		state.kbd = kbd;
		state.open = true;
	}, payload.delayDuration);
}

function closeTooltip(): void {
	if (timer) clearTimeout(timer);
	timer = null;
	state.open = false;
}

export function useGlobalTooltip() {
	return { state, openTooltip, closeTooltip };
}
