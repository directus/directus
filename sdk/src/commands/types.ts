export interface Command<Output extends object | unknown, Configuration extends object, _Schema extends object> {
	(configuration: Configuration): Promise<Output>;
}
