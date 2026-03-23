import type { Target } from '../operation.vue';

export interface Arrow {
	id: string;
	d: string;
	type: Target;
	loner: boolean;
	isHint?: boolean;
}

export interface Panel {
	id: string;
	resolve: string;
	reject: string;
	x: number;
	y: number;
}
