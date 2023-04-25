import { expect, test, describe } from 'vitest';
import { resolvePreset } from './transformations.js';
import type { File } from '../types/files.js';
import type { TransformationParams } from '../types/assets.js';

describe('resolvePreset', () => {
	test('Prevent input mutation #18301', () => {
		const inputData: TransformationParams = {
			key: 'system-small-cover',
			format: 'jpg',
			transforms: [
				[
					'resize',
					{
						width: 64,
						height: 64,
						fit: 'cover',
					},
				],
				['toFormat', 'jpg', {}],
			],
		};

		const inputFile: File = {
			id: '43a15f67-84a7-4e07-880d-e46a9f33c542',
			storage: 'local',
			filename_disk: 'test',
			filename_download: 'test',
			title: null,
			type: null,
			folder: null,
			uploaded_by: null,
			uploaded_on: new Date(),
			charset: null,
			filesize: 123,
			width: null,
			height: null,
			duration: null,
			embed: null,
			description: null,
			location: null,
			tags: null,
			metadata: null,
		};

		resolvePreset(inputData, inputFile);

		expect(inputData.transforms).toStrictEqual([
			[
				'resize',
				{
					width: 64,
					height: 64,
					fit: 'cover',
				},
			],
			['toFormat', 'jpg', {}],
		]);
	});
});
