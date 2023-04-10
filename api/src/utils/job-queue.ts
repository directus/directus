type Job = () => Promise<void> | void;

export class JobQueue {
	private running: boolean;
	private jobs: Job[];

	constructor() {
		this.running = false;
		this.jobs = [];
	}

	public enqueue(job: Job): void {
		this.jobs.push(job);

		if (!this.running) {
			this.run();
		}
	}

	private async run(): Promise<void> {
		this.running = true;

		while (this.jobs.length > 0) {
			const job = this.jobs.shift()!;

			await job();
		}

		this.running = false;
	}
}
