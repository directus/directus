import axios, { AxiosResponse } from 'axios';

export const login = async (port: number, email: string, password: string): Promise<AxiosResponse<any>> => {
	try {
		const body = {
			email: email,
			password: password,
		};
		const response = await axios.post(`http://localhost:${port}/auth/login`, body);

		return response.data.data;
	} catch (error: any) {
		throw new Error(error);
	}
};
