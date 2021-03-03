export type TransportResponse<T> = {
	data: T;
	status: number;
	statusText: string;
	headers: any;
};

export interface ITransport {
	token: string | null;
	get<T = any>(path: string, options?: any): Promise<TransportResponse<T>>;
	post<T = any>(path: string, options?: any): Promise<TransportResponse<T>>;
	patch<T = any>(path: string, options?: any): Promise<TransportResponse<T>>;
	delete<T = any>(path: string, options?: any): Promise<TransportResponse<T>>;
	head<T = any>(path: string, options?: any): Promise<TransportResponse<T>>;
}
