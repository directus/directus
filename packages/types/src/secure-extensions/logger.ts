export type Logger = {
	info: (...data: any[]) => void;
	warn: (...data: any[]) => void;
	error: (...data: any[]) => void;
	trace: (...data: any[]) => void;
	debug: (...data: any[]) => void;
	fatal: (...data: any[]) => void;
}
