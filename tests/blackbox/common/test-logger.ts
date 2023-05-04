import { ChildProcess } from 'child_process';

export class TestLogger {
	private logs: string;
	private server: ChildProcess;
	private stopCondition: string;
	private filterCondition?: string;
	private stopped?: boolean;
	private resolve?: (log: string) => void;

	/**
	 *
	 * @param server Process running a Directus instance
	 * @param stopCondition Finish as soon as the specified string appears in the logs.
	 * @param filter Only capture log chunks containing the specified string, if `true` uses the same string as defined for `stopCondition`
	 */
	constructor(server: ChildProcess, stopCondition: string, filterCondition?: boolean | string) {
		this.logs = '';
		this.server = server;
		this.stopCondition = stopCondition;

		if (filterCondition) {
			this.filterCondition = filterCondition === true ? stopCondition : filterCondition;
		}

		// Discard data up to this point
		server.stdout?.read();

		server.stdout?.on('data', this.processChunks);
	}

	private processChunks = (chunk: any) => {
		const logLine = String(chunk);

		if (!this.stopped && (!this.filterCondition || logLine.includes(this.filterCondition))) {
			this.logs += logLine;
		}

		if (this.logs.includes(this.stopCondition)) {
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
