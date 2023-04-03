import { ChildProcess } from 'child_process';

type StopFunction = (logs: string, logLine: string) => boolean;
type FilterFunction = (logLine: string) => boolean;

export class TestLogger {
	private logs: string;
	private server: ChildProcess;
	private stopCondition: StopFunction;
	private filterCondition?: FilterFunction;
	private stopped?: boolean;
	private resolve?: (log: string) => void;

	constructor(server: ChildProcess, stopCondition: string | StopFunction, filter?: string | FilterFunction);
	constructor(server: ChildProcess, stopCondition: string, filter?: boolean | string | FilterFunction);
	constructor(server: ChildProcess, stopCondition: string | StopFunction, filter?: boolean | string | FilterFunction) {
		this.logs = '';
		this.server = server;
		this.stopCondition = typeof stopCondition === 'string' ? (logs) => logs.includes(stopCondition) : stopCondition;
		if (filter) {
			if (filter === true) {
				if (typeof stopCondition === 'string') {
					this.filterCondition = (logLine) => logLine.includes(stopCondition);
				}
			} else {
				this.filterCondition = typeof filter === 'string' ? (logs) => logs.includes(filter) : filter;
			}
		}

		// Discard data up to this point
		server.stdout?.read();

		server.stdout?.on('data', this.processChunks);
	}

	private processChunks = (chunk: any) => {
		const logLine = String(chunk);

		if (!this.stopped && (!this.filterCondition || this.filterCondition(logLine))) {
			this.logs += logLine;
		}

		if (this.stopCondition(this.logs, logLine)) {
			this.stopped = true;
			this.cleanup();

			if (this.resolve) {
				this.resolve(this.logs);
			}
		}
	};

	getLogs = () => {
		return new Promise<string>((resolve) => {
			if (this.stopped) {
				resolve(this.logs);
			} else {
				this.resolve = resolve;
			}
		});
	};

	cleanup = () => {
		this.server.stdout?.off('data', this.processChunks);
	};
}
