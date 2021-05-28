export type Dashboard = {
	id: string;
	name: string;
	note: string;
	icon: string;
	panels: Panel[];
	date_created: string;
	user_created: string;
};

export type Panel = {
	id: string;
	dashboard: string;
	show_header: boolean;
	name: string;
	icon: string;
	color: string;
	note: string;
	type: string;
	position_x: number;
	position_y: number;
	width: number;
	height: number;
	options: Record<string, any>;
	date_created: string;
	user_created: string;
};
