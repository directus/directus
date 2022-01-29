type TriggerType = 'filter' | 'action' | 'init' | 'schedule' | 'operation' | 'webhook';
type Status = 'active' | 'inactive';

export interface Flow {
	id: string;
	name: string;
	icon: string;
	note: string;
	status: Status;
	trigger: TriggerType | null;
	options: Record<string, any>;
	operation: Operation | null;
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
	note: string;
	status: Status;
	trigger: TriggerType | null;
	options: Record<string, any>;
	operation: string | null;
	operations: OperationRaw[];
	date_created: string;
	user_created: string;
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
