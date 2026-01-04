export type MiniApp = {
	id: string;
	name: string;
	icon: string;
	description: string | null;
	ui_schema: Record<string, any> | null;
	panel_config_schema: Record<string, any> | null;
	script: string | null;
	css: string | null;
	status: 'draft' | 'published';
	user_created: string | null;
	date_created: string | null;
	user_updated: string | null;
	date_updated: string | null;
};
