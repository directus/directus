export type TriggerType = 'event' | 'schedule' | 'operation' | 'webhook' | 'manual';

type Status = 'active' | 'inactive';

export type CollapseState = 'open' | 'closed' | 'locked';

export interface Flow {
	id: string;
	name: string | null;
	icon: string | null;
	description: string | null;
	status: Status;
	trigger: TriggerType | null;
	options: Record<string, any>;
	operation: Operation | null;
	accountability: 'all' | 'activity' | null;
	group: string | null;
	sort: number | null;
	collapse: CollapseState;
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
	icon: string | null;
	color: string | null;
	description: string | null;
	status: Status;
	trigger: TriggerType | null;
	options: Record<string, any> | null;
	operation: string | null;
	operations: OperationRaw[];
	date_created: string;
	user_created: string;
	accountability: 'all' | 'activity' | null;
	group: string | null;
	sort: number | null;
	collapse: CollapseState;
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
