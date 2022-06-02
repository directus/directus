export type TriggerType = 'event' | 'schedule' | 'operation' | 'webhook' | 'manual';
type Status = 'active' | 'inactive';

export interface Flow {
	id: string;
	name: string;
	icon: string;
	description: string;
	status: Status;
	trigger: TriggerType | null;
	options: Record<string, any>;
	operation: Operation | null;
	accountability: 'all' | 'activity' | null;
}

export interface Operation {
	id: string;
	name: string | null;
	key: string;
	type: string;
	position_x: number;
	position_y: number;
	options: Record<string, any>;
	resolve: Operation | null;
	reject: Operation | null;
}

export interface FlowRaw {
	id: string;
	name: string;
	icon: string;
	color: string;
	description: string;
	status: Status;
	trigger: TriggerType | null;
	options: Record<string, any>;
	operation: string | null;
	operations: OperationRaw[];
	date_created: string;
	user_created: string;
	accountability: 'all' | 'activity' | null;
}

export interface OperationRaw {
	id: string;
	name: string | null;
	key: string;
	type: string;
	position_x: number;
	position_y: number;
	options: Record<string, any>;
	resolve: string | null;
	reject: string | null;
	flow: string;
	date_created: string;
	user_created: string;
}
