import { expect, test, describe } from 'vitest';
import { maybeExtractFormat, resolvePreset } from './transformations.js';
import type { File } from '../types/files.js';
import type { Transformation, TransformationParams } from '../types/assets.js';

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

describe('resolvePreset', () => {
	test('Prevent input mutation #18301', () => {
		const transformationParams: TransformationParams = {
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
			],
		};

		resolvePreset({ transformationParams }, inputFile);

		expect(transformationParams.transforms).toStrictEqual([
			[
				'resize',
				{
					width: 64,
					height: 64,
					fit: 'cover',
				},
			],
		]);
	});

	test('Add toFormat transformation', () => {
		const transformationParams: TransformationParams = {
			key: 'system-small-cover',
			format: 'jpg',
			quality: 80,
			transforms: [
				[
					'resize',
					{
						width: 64,
						height: 64,
						fit: 'cover',
					},
				],
			],
		};

		const output = resolvePreset({ transformationParams }, inputFile);

		expect(output).toStrictEqual([
			[
				'resize',
				{
					width: 64,
					height: 64,
					fit: 'cover',
				},
			],
			['toFormat', 'jpg', { quality: 80 }],
		]);
	});

	test('Add resize transformation', () => {
		const transformationParams: TransformationParams = {
			key: 'system-small-cover',
			width: 64,
			height: 64,
			fit: 'cover',
		};

		const output = resolvePreset({ transformationParams }, inputFile);

		expect(output).toStrictEqual([
			[
				'resize',
				{
					width: 64,
					height: 64,
					fit: 'cover',
					withoutEnlargement: undefined,
				},
			],
		]);
	});

	test('Resolve auto format (fallback)', () => {
		const transformationParams: TransformationParams = {
			format: 'auto',
		};

		const output = resolvePreset({ transformationParams }, inputFile);

		expect(output).toStrictEqual([['toFormat', 'jpg', { quality: undefined }]]);
	});

	test('Resolve auto format (with accept header)', () => {
		const transformationParams: TransformationParams = {
			format: 'auto',
		};

		const output = resolvePreset({ transformationParams, acceptFormat: 'avif' }, inputFile);

		expect(output).toStrictEqual([['toFormat', 'avif', { quality: undefined }]]);
	});

	test('Resolve auto format (format with transparency support)', () => {
		const transformationParams: TransformationParams = {
			format: 'auto',
		};

		const inputFileAvif = { ...inputFile, type: 'image/avif' };

		const output = resolvePreset({ transformationParams }, inputFileAvif);

		expect(output).toStrictEqual([['toFormat', 'png', { quality: undefined }]]);
	});

	test('Resolve auto format (original type)', () => {
		const transformationParams: TransformationParams = {
			format: 'auto',
		};

		const inputFilePng = { ...inputFile, type: 'image/png' };

		const output = resolvePreset({ transformationParams }, inputFilePng);

		expect(output).toStrictEqual([['toFormat', 'png', { quality: undefined }]]);
	});
});

describe('maybeExtractFormat', () => {
	test('get last format', () => {
		const inputTransformations: Transformation[] = [
			['toFormat', 'jpg', { quality: 80 }],
			['toFormat', 'webp', { quality: 80 }],
		];

		const output = maybeExtractFormat(inputTransformations);

		expect(output).toBe('webp');
	});

	test('get undefined', () => {
		const inputTransformations: Transformation[] = [];

		const output = maybeExtractFormat(inputTransformations);

		expect(output).toBe(undefined);
	});
});
