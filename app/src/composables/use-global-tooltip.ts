import type { ReferenceElement } from 'reka-ui';

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
