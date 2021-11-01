export type Webhook = {
	id: number;
	name: string;
	method: 'GET' | 'POST';
	url: string;
	status: 'active' | 'inactive';
	data: boolean;
	actions: string[];
	collections: string[];
	headers: WebhookHeader[];
};

export type WebhookHeader = { header: string; value: string };
