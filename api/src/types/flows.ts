type TriggerType = 'filter' | 'action' | 'init' | 'schedule';

export interface Flow {
	name: string;
	icon: string;
	note: string;
	status: 'active' | 'inactive';
	trigger: TriggerType;
	options: Record<string, any>;
	operation: Operation | null;
}

export interface Operation {
	type: string;
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
	trigger: TriggerType;
	options: Record<string, any>;
	operations: OperationRaw[];
}

export interface OperationRaw {
	id: string;
	flow: string;
	type: string;
	options: Record<string, any>;
	next: string | null;
	reject: string | null;
}
