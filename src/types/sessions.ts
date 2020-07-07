export type Session = {
	token: string;
	user: string;
	expires: Date;
	ip: string | null;
	user_agent: string | null;
};
