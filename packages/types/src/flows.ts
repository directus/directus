import type { User } from './users.js';

export interface FlowRaw {
	id: string;
	name: string;
	icon: string | null;
	color: string | null;
	description: string | null;
	status: 'active' | 'inactive';
	trigger: string | null;
	accountability: 'all' | 'activity' | null;
	options: Record<string, any> | null;
	operation: string | null;
	date_created: string;
	user_created: string | null;
}

export interface Flow extends Omit<FlowRaw, 'user_created'> {
	user_created: User | null;
	operations: Operation[];
}

export interface OperationRaw {
	id: string;
	name: string | null;
	key: string;
	type: string;
	position_x: number;
	position_y: number;
	options: Record<string, any> | null;
	resolve: string | null;
	reject: string | null;
	flow: string;
	date_created: string;
	user_created: string | null;
}

export interface Operation extends Omit<OperationRaw, 'user_created' | 'resolve' | 'reject'> {
	user_created: User | null;
	resolve: Operation | null;
	reject: Operation | null;
}
