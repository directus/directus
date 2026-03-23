export type LoginResult = {
	accessToken: string;
	refreshToken: string;
	expires: number;
	id?: string;
};
