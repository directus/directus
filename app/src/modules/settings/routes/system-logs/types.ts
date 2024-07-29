export type Log = {
	id: string;
	instance: string;
	expanded?: boolean;
	data: Record<string, any> & {
		level: number;
		time: number;
		msg: string;
	};
};
