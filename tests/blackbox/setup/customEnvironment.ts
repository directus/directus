import NodeEnvironment from 'jest-environment-node';
import axios from 'axios';
import * as SequentialTests from './sequentialTests.js';
import { sleep } from '../utils/sleep';
import * as common from '../common';

/* eslint-disable no-var */
declare global {
	var directusFlowDataServerUrl: string;
	var totalTestsCount: number;
	var testFilePath: string;
}

class CustomEnvironment extends NodeEnvironment {
	constructor(config: any, context: any) {
		super(config, context);
		this.global.testFilePath = String(context.testPath).split('blackbox')[1]!;
	}

	async setup() {
		const serverUrl = process.env.serverUrl;
		const totalTestsCount = Number(process.env.totalTestsCount);

		if (!serverUrl || isNaN(totalTestsCount)) {
			throw 'Missing flow env variables';
		}

		this.global.directusFlowDataServerUrl = serverUrl;
		this.global.totalTestsCount = totalTestsCount;

		const testIndex = SequentialTests.getReversedTestIndex(this.global.testFilePath);

		while (testIndex !== 0) {
			try {
				const response = await axios.get(`${this.global.directusFlowDataServerUrl}/items/tests_flow_completed`, {
					params: {
						'aggregate[count]': 'id',
					},
					headers: {
						Authorization: `Bearer ${common.USER.TESTS_FLOW.TOKEN}`,
					},
				});

				const completedCount = Number(response.data.data[0].count.id);

				if (testIndex >= 0) {
					if (completedCount >= testIndex) break;
				} else if (this.global.totalTestsCount + testIndex === completedCount) {
					break;
				}
			} catch (err) {
				continue;
			}

			await sleep(1000);
		}

		await super.setup();
	}

	async teardown() {
		const body = {
			test_file_path: this.global.testFilePath,
		};

		await axios.post(`${this.global.directusFlowDataServerUrl}/items/tests_flow_completed`, body, {
			headers: {
				Authorization: `Bearer ${common.USER.TESTS_FLOW.TOKEN}`,
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
