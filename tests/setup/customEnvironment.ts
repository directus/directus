import NodeEnvironment from 'jest-environment-node';
import axios from 'axios';
import * as SequentialTests from './sequentialTests.js';
import { sleep } from './utils/sleep';

/* eslint-disable no-var */
declare global {
	var directusFlowDataServerUrl: string;
	var totalTestsCount: number;
	var testFilePath: string;
}

class CustomEnvironment extends NodeEnvironment {
	constructor(config: any, context: any) {
		super(config);
		this.global.testFilePath = String(context.testPath).split('tests')[1]!;
	}

	async setup() {
		const serverUrl = process.env.serverUrl;
		const totalTestsCount = Number(process.env.totalTestsCount);

		if (!serverUrl || isNaN(totalTestsCount)) {
			throw 'Missing flow env variables';
		}

		this.global.directusFlowDataServerUrl = serverUrl;
		this.global.totalTestsCount = totalTestsCount;

		let waiting = SequentialTests.getReversedTestIndex(this.global.testFilePath) !== 0;

		while (waiting) {
			const response = await axios.get(
				`${this.global.directusFlowDataServerUrl}/items/tests_flow_completed?aggregate[count]=id&access_token=AdminToken`
			);
			const completedCount = Number(response.data.data[0].count.id);

			if (
				this.global.totalTestsCount + SequentialTests.getReversedTestIndex(this.global.testFilePath) ===
				completedCount
			) {
				waiting = false;
			} else {
				await sleep(1000);
			}
		}

		await super.setup();
	}

	async teardown() {
		const body = {
			test_file_path: this.global.testFilePath,
		};

		await axios.post(`${this.global.directusFlowDataServerUrl}/items/tests_flow_completed`, body, {
			headers: {
				Authorization: 'Bearer AdminToken',
				'Content-Type': 'application/json',
			},
		});

		await super.teardown();
	}

	getVmContext() {
		return super.getVmContext();
	}
}

export default CustomEnvironment;
