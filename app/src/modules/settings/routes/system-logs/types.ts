export type Log = {
	index: number;
	instance: string;
	selected?: boolean;
	data: Record<string, any> & {
		level: number;
		time: number;
		msg: string;
	};
	notice: boolean;
};
