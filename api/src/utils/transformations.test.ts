import type { File, Transformation, TransformationParams } from '@directus/types';
import { describe, expect, test } from 'vitest';
import { maybeExtractFormat, resolvePreset } from './transformations.js';

const inputFile = {
	id: '43a15f67-84a7-4e07-880d-e46a9f33c542',
	storage: 'local',
	filename_disk: 'test',
	filename_download: 'test',
	title: null,
	type: null,
	folder: null,
	uploaded_by: null,
	uploaded_on: '2023-12-19T16:12:53.149Z',
	charset: null,
	filesize: 123,
	width: 1920,
	height: 1080,
	duration: null,
	embed: null,
	description: null,
	location: null,
	tags: null,
	metadata: null,
	modified_by: null,
	modified_on: '',
	focal_point_x: null,
	focal_point_y: null,
	created_on: '',
	tus_data: null,
	tus_id: null,
} satisfies File;

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

	test('Add resize transformation: cover without focal point', () => {
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

	test('Add resize transformation: cover with centered focal point', () => {
		const transformationParams: TransformationParams = {
			key: 'system-small-cover',
			width: 64,
			height: 64,
			fit: 'cover',
		};

		const output = resolvePreset(
			{ transformationParams },
			{ ...inputFile, focal_point_x: inputFile.width / 2, focal_point_y: inputFile.height / 2 },
		);

		/*
		 * The following is relevant for a centered focal point
		 * The initial aspect ratio is 16:9 so we have to resize the image to an intermediate size
		 * that fully covers our desired 1:1 aspect ratio and then crop out the final dimensions
		 * This results in: 1080/64 == 16.875   -->   1920/16.875 == 113.77 (round up) == 114 width
		 * Next we need the inner padding to get the centered crop: (114 - 64) / 2 == 25
		 * That results in the following
		 * <──────────114───────────>
		 * <──25──><───64───><──25──>
		 * ┌──────┬──────────┬──────┐
		 * │      │          │      │
		 * │      │ extract  │      │
		 * │      │ centered │      │
		 * │      │          │      │
		 * └──────┴──────────┴──────┘
		 */
		expect(output).toStrictEqual([
			[
				'resize',
				{
					width: 114,
					height: 64,
					fit: 'cover',
					withoutEnlargement: undefined,
				},
			],
			['extract', { left: 25, top: 0, width: 64, height: 64 }],
		]);
	});

	test('Add resize transformation: cover with negative focal point', () => {
		const transformationParams: TransformationParams = {
			key: 'system-small-cover',
			width: 64,
			height: 64,
			fit: 'cover',
		};

		const output = resolvePreset({ transformationParams }, { ...inputFile, focal_point_x: -999, focal_point_y: -999 });

		/*
		 * That should result in the following
		 * <──────────114────────────>
		 * <─────64──────><────50────>
		 * ┌─────────────┬───────────┐
		 * │             │           │
		 * │   extract   │           │
		 * │             │           │
		 * └─────────────┴───────────┘
		 */
		expect(output).toStrictEqual([
			[
				'resize',
				{
					width: 114,
					height: 64,
					fit: 'cover',
					withoutEnlargement: undefined,
				},
			],
			['extract', { left: 0, top: 0, width: 64, height: 64 }],
		]);
	});

	test('Add resize transformation: cover with out of bounds focal point', () => {
		const transformationParams: TransformationParams = {
			key: 'system-small-cover',
			width: 64,
			height: 64,
			fit: 'cover',
		};

		const output = resolvePreset({ transformationParams }, { ...inputFile, focal_point_x: 9999, focal_point_y: -999 });

		/*
		 * That should result in the following
		 * <──────────114────────────>
		 * <────50────><─────64──────>
		 * ┌───────────┬─────────────┐
		 * │           │             │
		 * │           │   extract   │
		 * │           │             │
		 * └───────────┴─────────────┘
		 */
		expect(output).toStrictEqual([
			[
				'resize',
				{
					width: 114,
					height: 64,
					fit: 'cover',
					withoutEnlargement: undefined,
				},
			],
			['extract', { left: 50, top: 0, width: 64, height: 64 }],
		]);
	});

	test('Add resize transformation: contain', () => {
		const transformationParams: TransformationParams = {
			key: 'system-small-cover',
			width: 64,
			height: 64,
			fit: 'contain',
		};

		const output = resolvePreset({ transformationParams }, inputFile);

		expect(output).toStrictEqual([
			[
				'resize',
				{
					width: 64,
					height: 64,
					fit: 'contain',
					withoutEnlargement: undefined,
				},
			],
		]);
	});

	test('Resize transformation with withoutEnlargement clamps dimensions larger than original', () => {
		const transformationParams: TransformationParams = {
			key: 'test-larger-than-original',
			width: 2000, // larger than original width (1920)
			height: 1200, // larger than original height (1080)
			fit: 'cover',
			withoutEnlargement: true,
		};

		const output = resolvePreset(
			{ transformationParams },
			{ ...inputFile, focal_point_x: inputFile.width / 2, focal_point_y: inputFile.height / 2 },
		);

		// Dimensions should be clamped to original (1920x1080)
		// Since we're requesting 1920x1080 with a centered focal point on a 1920x1080 image,
		// the intermediate dimensions will be 1920x1080, and the extract will be the full image
		expect(output).toStrictEqual([
			[
				'resize',
				{
					width: 1920,
					height: 1080,
					fit: 'cover',
					withoutEnlargement: true,
				},
			],
			['extract', { left: 0, top: 0, width: 1920, height: 1080 }],
		]);
	});

	test('Add resize transformation: withoutEnlargement clamps only width when height is smaller #22391', () => {
		// Width is larger, height is smaller - only width should be clamped
		const transformationParams: TransformationParams = {
			key: 'test-width-larger',
			width: 2000, // larger than original width (1920)
			height: 500, // smaller than original height (1080)
			fit: 'cover',
			withoutEnlargement: true,
		};

		const output = resolvePreset(
			{ transformationParams },
			{ ...inputFile, focal_point_x: inputFile.width / 2, focal_point_y: inputFile.height / 2 },
		);

		// Width should be clamped to 1920, height stays at 500
		// With 1920x500 target and centered focal point on 1920x1080 image:
		// hRatio = 1080/500 = 2.16, wRatio = 1920/1920 = 1
		// wRatio < hRatio, so factor = 1, width = 1920, height = 1080/1 = 1080
		// Extract region: left = 0, top = (1080/2 - 500/2) = 290
		expect(output).toStrictEqual([
			[
				'resize',
				{
					width: 1920,
					height: 1080,
					fit: 'cover',
					withoutEnlargement: true,
				},
			],
			['extract', { left: 0, top: 290, width: 1920, height: 500 }],
		]);
	});

	test('Add resize transformation: withoutEnlargement with smaller dimensions unchanged', () => {
		// Both dimensions are smaller than original - should work normally
		const transformationParams: TransformationParams = {
			key: 'test-smaller',
			width: 800,
			height: 600,
			fit: 'cover',
			withoutEnlargement: true,
		};

		const output = resolvePreset(
			{ transformationParams },
			{ ...inputFile, focal_point_x: inputFile.width / 2, focal_point_y: inputFile.height / 2 },
		);

		// 1920x1080 -> 800x600
		// hRatio = 1080/600 = 1.8, wRatio = 1920/800 = 2.4
		// hRatio < wRatio, so factor = 1.8, height = 600, width = Math.round(1920/1.8) = 1067
		// Extract region: newXCenter = 960/1.8 = 533.33, left = Math.round(533.33 - 400) = 133, top = 0
		expect(output).toStrictEqual([
			[
				'resize',
				{
					width: 1067,
					height: 600,
					fit: 'cover',
					withoutEnlargement: true,
				},
			],
			['extract', { left: 133, top: 0, width: 800, height: 600 }],
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
