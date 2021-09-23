export type Session = {
	token: string;
	user: string;
	expires: Date;
	ip: string | null;
	user_agent: string | null;
	data: Record<string, any> | null;
};
