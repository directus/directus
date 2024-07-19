export type Log = {
	uid: string;
	data: Record<string, any> & {
		level: number;
		time: number;
		msg: string;
	};
};
