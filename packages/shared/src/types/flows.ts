type TriggerType = 'filter' | 'action' | 'init' | 'schedule';

export interface Flow {
	name: string;
	icon: string;
	note: string;
	status: 'active' | 'inactive';
	trigger: TriggerType | null;
	options: Record<string, any>;
	operation: Operation | null;
}

export interface Operation {
	type: string;
	key: string;
	options: Record<string, any>;
	next: Operation | null;
	reject: Operation | null;
}

export interface FlowRaw {
	id: string;
	name: string;
	icon: string;
	note: string;
	status: 'active' | 'inactive';
	trigger: TriggerType | null;
	options: Record<string, any>;
	operation: string | null;
	operations: OperationRaw[];
	date_created: string;
	user_created: string;
}

export interface OperationRaw {
	id: string;
	type: string;
	key: string;
	options: Record<string, any>;
	next: string | null;
	reject: string | null;
	flow: string;
	date_created: string;
	user_created: string;
}
