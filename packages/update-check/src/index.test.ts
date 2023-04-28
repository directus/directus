import { randNumber, randSemver, randSentence, randWord } from '@ngneat/falso';
import { URL } from 'node:url';
import { gte } from 'semver';
import type { Response } from 'undici';
import { fetch } from 'undici';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { isUpToDate } from './index.js';

vi.mock('semver');
vi.mock('undici');
vi.mock('node:url');

let sample: {
	name: string;
	version: string;
	latest: string;
};

let mockResponse: { -readonly [P in keyof Response]: Response[P] };
let mockResponseJson: { 'dist-tags': { latest: string } };

beforeEach(() => {
	sample = {
		name: randWord(),
		version: randSemver(),
		latest: randSemver(),
	};

	mockResponseJson = { 'dist-tags': { latest: sample.latest } };
	mockResponse = { ok: true, json: vi.fn().mockResolvedValue(mockResponseJson) } as unknown as Response;

	vi.mocked(fetch).mockResolvedValue(mockResponse);
});

afterEach(() => {
	vi.resetAllMocks();
});

test('Creates URL for given package name', async () => {
	await isUpToDate(sample.name, sample.version);
	expect(URL).toHaveBeenCalledWith(sample.name, 'https://registry.npmjs.org');
});

test('Throws error if response is not ok', async () => {
	mockResponse.ok = false;
	mockResponse.status = randNumber({ min: 400, max: 599 });
	mockResponse.statusText = randSentence();

	try {
		await isUpToDate(sample.name, sample.version);
	} catch (err: any) {
		expect(err).toBeInstanceOf(Error);

		expect(err.message).toBe(
			`Couldn't find latest version for package "${sample.name}": ${mockResponse.status} ${mockResponse.statusText}`
		);
	}
});

test('Extracts latest version from package information', async () => {
	await isUpToDate(sample.name, sample.version);
	expect(mockResponse.json).toHaveBeenCalledOnce();
});

test('Throws error if latest version does not exist in json response', async () => {
	mockResponseJson['dist-tags'] = {} as unknown as (typeof mockResponseJson)['dist-tags'];

	try {
		await isUpToDate(sample.name, sample.version);
	} catch (err: any) {
		expect(err).toBeInstanceOf(Error);
		expect(err.message).toBe(`Couldn't find latest version for package "${sample.name}"`);
	}
});

test('Uses semver.gte to check if passed version is bigger than latest', async () => {
	sample.latest = '9.26.0';
	sample.version = '10.0.0';
	mockResponseJson['dist-tags'].latest = sample.latest;

	await isUpToDate(sample.name, sample.version);

	expect(gte).toHaveBeenCalledWith(sample.version, sample.latest);
});

test('Returns latest version if gte is false', async () => {
	vi.mocked(gte).mockReturnValue(false);

	const result = await isUpToDate(sample.name, sample.version);

	expect(result).toBe(sample.latest);
});

test('Returns null if gte is true', async () => {
	vi.mocked(gte).mockReturnValue(true);

	const result = await isUpToDate(sample.name, sample.version);

	expect(result).toBeNull();
});
