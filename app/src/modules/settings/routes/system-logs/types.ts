export type Log = {
	id: string;
	instance: string;
	data: Record<string, any> & {
		level: number;
		time: number;
		msg: string;
	};
};
