export type Webhook = {
	id: number;
	name: string;
	method: 'GET' | 'POST';
	url: string;
	status: 'active' | 'inactive';
	data: boolean;
	actions: string;
	collections: string;
};
