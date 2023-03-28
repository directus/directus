import { ChildProcess } from 'child_process';

export class TestLogger {
	private logs: string;
	private server: ChildProcess;
	private stopCondition: string;
	private stopped?: boolean;
	private resolve?: (log: string) => void;

	constructor(server: ChildProcess, stopCondition: string) {
		this.logs = '';
		this.server = server;
		this.stopCondition = stopCondition;

		server.stdout?.on('data', this.processChunks);
	}

	private processChunks = (chunk: any) => {
		if (!this.stopped) {
			this.logs += String(chunk);
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
		this.server.stdout?.removeListener('data', this.processChunks);
	};
}
