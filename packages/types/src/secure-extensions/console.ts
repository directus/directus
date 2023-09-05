export type ConsoleSecure = {
	debug(...data: any[]): void;
	error(...data: any[]): void;
	info(...data: any[]): void;
	log(...data: any[]): void;
	table(tabularData?: any, properties?: string[]): void;
	time(label?: string): void;
	timeEnd(label?: string): void;
	timeLog(label?: string, ...data: any[]): void;
	warn(...data: any[]): void;
}
