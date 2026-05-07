import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { computed } from 'vue';
import { useTranslationJob } from './use-translation-job';

type TranslationJobConfig = Parameters<ReturnType<typeof useTranslationJob>['start']>[0];

vi.mock('@/stores/settings', () => ({
	useSettingsStore: () => ({
		settings: {},
	}),
}));

vi.mock('@vueuse/core', () => ({
	useEventListener: vi.fn(),
}));

vi.mock('vue-i18n', () => ({
	createI18n: () => ({ global: { t: (key: string) => key } }),
	useI18n: () => ({
		t: (key: string) => key,
	}),
}));

vi.mock('@/utils/get-root-path', () => ({
	getRootPath: () => '/',
}));

vi.mock('@/utils/unexpected-error', () => ({
	unexpectedError: vi.fn(),
}));

const languageOptions = computed(() => [
	{ value: 'en', text: 'English' },
	{ value: 'fr', text: 'French' },
	{ value: 'es', text: 'Spanish' },
]);

function createJob() {
	const applyTranslatedFields = vi.fn();
	const job = useTranslationJob({ applyTranslatedFields, languageOptions });
	return { job: job!, applyTranslatedFields };
}

const baseConfig: TranslationJobConfig = {
	sourceLanguage: 'en',
	targetLanguages: ['fr', 'es'],
	model: { provider: 'anthropic', model: 'claude-sonnet-4-5' } as any,
	sourceContent: { title: 'Hello' },
	fieldDefinitions: [{ field: 'title', type: 'string', meta: { interface: 'input' } }] as any,
};

const multiFieldConfig: TranslationJobConfig = {
	sourceLanguage: 'en',
	targetLanguages: ['fr'],
	model: { provider: 'anthropic', model: 'claude-sonnet-4-5' } as any,
	sourceContent: {
		title: 'Hello',
		slug: 'hello',
		description: 'Body copy',
	},
	fieldDefinitions: [
		{ field: 'title', type: 'string', meta: { interface: 'input' } },
		{ field: 'slug', type: 'string', meta: { interface: 'input' } },
		{ field: 'description', type: 'text', meta: { interface: 'input-multiline' } },
	] as any,
};

function createStreamResponse(json: string) {
	const encoder = new TextEncoder();

	const stream = new ReadableStream({
		start(controller) {
			controller.enqueue(encoder.encode(json));
			controller.close();
		},
	});

	return new Response(stream, {
		status: 200,
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
}

function createErrorResponse(status: number, body?: any) {
	return new Response(JSON.stringify(body ?? { errors: [{ message: 'Server error' }] }), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

function mockFetchStream(json: string = '{"title":"Translated"}') {
	vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(createStreamResponse(json)));
}

function mockFetchError(status: number, body?: any) {
	vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(createErrorResponse(status, body)));
}

function mockFetchHang() {
	vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise(() => {}));
}

describe('useTranslationJob', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('start sets jobState to translating and inits langStatuses', () => {
		const { job } = createJob();

		mockFetchHang();
		job.start({ ...baseConfig, targetLanguages: ['fr'] });

		expect(job.jobState.value).toBe('translating');
		expect(job.langStatuses.value['fr']?.status).toBe('translating');
		expect(job.totalCount.value).toBe(1);
		expect(job.isTranslating.value).toBe(true);
	});

	test('start streams and applies translations then transitions to complete', async () => {
		const { job, applyTranslatedFields } = createJob();

		mockFetchStream('{"title":"Bonjour"}');
		job.start(baseConfig);
		await flushPromises();

		expect(globalThis.fetch).toHaveBeenCalledTimes(2);

		expect(job.jobState.value).toBe('complete');
		expect(job.langStatuses.value['fr']).toEqual({ status: 'done' });
		expect(job.langStatuses.value['es']).toEqual({ status: 'done' });

		expect(applyTranslatedFields).toHaveBeenCalledTimes(2);
		expect(applyTranslatedFields).toHaveBeenCalledWith({ title: 'Bonjour' }, 'fr');
		expect(applyTranslatedFields).toHaveBeenCalledWith({ title: 'Bonjour' }, 'es');
	});

	test('cancel aborts requests and resets state', async () => {
		const { job, applyTranslatedFields } = createJob();

		mockFetchHang();

		job.start(baseConfig);
		job.cancel();

		expect(job.jobState.value).toBe('idle');
		expect(Object.keys(job.langStatuses.value)).toHaveLength(0);

		await flushPromises();

		expect(applyTranslatedFields).not.toHaveBeenCalled();
	});

	test('start cancels any prior job', async () => {
		const { job } = createJob();

		mockFetchHang();
		job.start(baseConfig);

		expect(job.jobState.value).toBe('translating');

		mockFetchStream();
		job.start({ ...baseConfig, targetLanguages: ['fr'] });
		await flushPromises();

		expect(job.jobState.value).toBe('complete');
		expect(Object.keys(job.langStatuses.value)).toEqual(['fr']);
	});

	test('API error sets error status with message', async () => {
		const { job } = createJob();

		mockFetchError(500, { errors: [{ message: 'Bad request' }] });

		job.start({ ...baseConfig, targetLanguages: ['fr'] });
		await flushPromises();

		expect(job.langStatuses.value['fr']).toEqual({
			status: 'error',
			error: 'Bad request',
		});

		expect(job.jobState.value).toBe('complete');
		expect(job.hasErrors.value).toBe(true);
	});

	test('429 retries with exponential backoff then succeeds', async () => {
		vi.useFakeTimers();

		const { job, applyTranslatedFields } = createJob();

		let callCount = 0;

		vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
			callCount++;

			if (callCount === 1) {
				return Promise.resolve(createErrorResponse(429));
			}

			return Promise.resolve(createStreamResponse('{"title":"Bonjour"}'));
		});

		job.start({ ...baseConfig, targetLanguages: ['fr'] });
		await flushPromises();

		expect(job.langStatuses.value['fr']?.status).toBe('retrying');

		await vi.advanceTimersByTimeAsync(1000);
		await flushPromises();

		expect(job.langStatuses.value['fr']).toEqual({ status: 'done' });
		expect(applyTranslatedFields).toHaveBeenCalledWith({ title: 'Bonjour' }, 'fr');

		vi.useRealTimers();
	});

	test('429 exhausts retries and sets error', async () => {
		vi.useFakeTimers();

		const { job } = createJob();

		mockFetchError(429);

		job.start({ ...baseConfig, targetLanguages: ['fr'] });

		// Exhaust all retries (3 retries with exponential backoff: 1s, 2s, 4s)
		for (let i = 0; i < 3; i++) {
			await flushPromises();
			await vi.advanceTimersByTimeAsync(Math.pow(2, i) * 1000);
		}

		await flushPromises();

		expect(job.langStatuses.value['fr']?.status).toBe('error');
		expect(job.jobState.value).toBe('complete');

		vi.useRealTimers();
	});

	test('retry re-translates a single failed language', async () => {
		const { job, applyTranslatedFields } = createJob();

		let callCount = 0;

		vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
			callCount++;

			if (callCount === 2) {
				return Promise.resolve(createErrorResponse(500, { errors: [{ message: 'fail' }] }));
			}

			return Promise.resolve(createStreamResponse('{"title":"Translated"}'));
		});

		job.start(baseConfig);
		await flushPromises();

		expect(job.langStatuses.value['es']?.status).toBe('error');
		expect(job.langStatuses.value['fr']?.status).toBe('done');

		applyTranslatedFields.mockClear();

		vi.spyOn(globalThis, 'fetch').mockResolvedValue(createStreamResponse('{"title":"Traducido"}'));

		await job.retry('es');

		expect(job.langStatuses.value['es']).toEqual({ status: 'done' });
		expect(applyTranslatedFields).toHaveBeenCalledWith({ title: 'Traducido' }, 'es');
		expect(job.jobState.value).toBe('complete');
	});

	test('AbortError is silently ignored', async () => {
		const { job, applyTranslatedFields } = createJob();

		vi.spyOn(globalThis, 'fetch').mockRejectedValue(Object.assign(new Error('Aborted'), { name: 'AbortError' }));

		job.start({ ...baseConfig, targetLanguages: ['fr'] });
		await flushPromises();

		expect(applyTranslatedFields).not.toHaveBeenCalled();
		expect(job.langStatuses.value['fr']?.status).not.toBe('error');
	});

	test('retry sets jobState to translating during retry', async () => {
		const { job } = createJob();

		let callCount = 0;

		vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
			callCount++;

			if (callCount === 1) {
				return Promise.resolve(createErrorResponse(500, { errors: [{ message: 'fail' }] }));
			}

			return Promise.resolve(createStreamResponse('{"title":"Translated"}'));
		});

		job.start({ ...baseConfig, targetLanguages: ['fr'] });
		await flushPromises();

		expect(job.langStatuses.value['fr']?.status).toBe('error');
		expect(job.jobState.value).toBe('complete');

		vi.spyOn(globalThis, 'fetch').mockResolvedValue(createStreamResponse('{"title":"OK"}'));

		const retryPromise = job.retry('fr');

		expect(job.jobState.value).toBe('translating');

		await retryPromise;

		expect(job.langStatuses.value['fr']?.status).toBe('done');
		expect(job.jobState.value).toBe('complete');
	});

	test('reset clears all state back to initial', async () => {
		const { job } = createJob();

		mockFetchStream();
		job.start({ ...baseConfig, targetLanguages: ['fr'] });
		await flushPromises();

		expect(job.jobState.value).toBe('complete');

		job.reset();

		expect(job.jobState.value).toBe('idle');
		expect(Object.keys(job.langStatuses.value)).toHaveLength(0);

		expect(job.getActiveField('fr')).toBeNull();
		expect(job.getQueuedFields('fr')).toEqual([]);
		expect(job.getCompletedFields('fr')).toEqual([]);
	});

	test('initializes field progress with the first selected field active', () => {
		const { job } = createJob();

		mockFetchHang();
		job.start(multiFieldConfig);

		expect(job.getActiveField('fr')).toBe('title');
		expect(job.getQueuedFields('fr')).toEqual(['slug', 'description']);
		expect(job.getCompletedFields('fr')).toEqual([]);
	});

	test('advances field progress as later keys arrive in the stream', async () => {
		const { job } = createJob();

		const encoder = new TextEncoder();
		let controller: ReadableStreamDefaultController<Uint8Array>;

		const stream = new ReadableStream<Uint8Array>({
			start(c) {
				controller = c;
			},
		});

		vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			new Response(stream, {
				status: 200,
				headers: { 'Content-Type': 'text/plain; charset=utf-8' },
			}),
		);

		job.start(multiFieldConfig);
		await flushPromises();

		expect(job.getActiveField('fr')).toBe('title');
		expect(job.getQueuedFields('fr')).toEqual(['slug', 'description']);

		controller!.enqueue(encoder.encode('{"title":"Bonjour","slug":"bonjour","description":"Des'));
		await flushPromises();

		expect(job.getCompletedFields('fr')).toEqual(['title', 'slug']);
		expect(job.getActiveField('fr')).toBe('description');
		expect(job.getQueuedFields('fr')).toEqual([]);

		controller!.enqueue(encoder.encode('cription"}'));
		controller!.close();
		await flushPromises();

		expect(job.getCompletedFields('fr')).toEqual(['title', 'slug', 'description']);
		expect(job.getActiveField('fr')).toBeNull();
		expect(job.getQueuedFields('fr')).toEqual([]);
	});

	test('applies partial updates for the active long-form field while it streams', async () => {
		const { job, applyTranslatedFields } = createJob();

		const encoder = new TextEncoder();
		let controller: ReadableStreamDefaultController<Uint8Array>;

		const stream = new ReadableStream<Uint8Array>({
			start(c) {
				controller = c;
			},
		});

		vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			new Response(stream, {
				status: 200,
				headers: { 'Content-Type': 'text/plain; charset=utf-8' },
			}),
		);

		job.start({
			sourceLanguage: 'en',
			targetLanguages: ['fr'],
			model: { provider: 'anthropic', model: 'claude-sonnet-4-5' } as any,
			sourceContent: {
				title: 'Hello',
				content: '<p>Hello world</p>',
			},
			fieldDefinitions: [
				{ field: 'title', type: 'string', meta: { interface: 'input' } },
				{ field: 'content', type: 'text', meta: { interface: 'input-rich-text-html' } },
			] as any,
		});

		await flushPromises();

		controller!.enqueue(encoder.encode('{"title":"Bonjour","content":"<p>Bon'));
		await flushPromises();

		expect(applyTranslatedFields).toHaveBeenCalledWith({ title: 'Bonjour' }, 'fr');
		expect(applyTranslatedFields).toHaveBeenCalledWith({ content: '<p>Bon' }, 'fr');

		controller!.enqueue(encoder.encode('jour le monde</p>"}'));
		controller!.close();
		await flushPromises();

		expect(applyTranslatedFields).toHaveBeenCalledWith({ content: '<p>Bonjour le monde</p>' }, 'fr');
	});

	test('clears active and queued fields when a language errors', async () => {
		const { job } = createJob();

		mockFetchError(500, { errors: [{ message: 'Bad request' }] });
		job.start(multiFieldConfig);
		await flushPromises();

		expect(job.getActiveField('fr')).toBeNull();
		expect(job.getQueuedFields('fr')).toEqual([]);
	});
});
