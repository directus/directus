import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, ref } from 'vue';
import { useTemplateData } from './use-template-data';

const requestSpy = vi.fn().mockResolvedValue({});

vi.mock('@/sdk', () => ({
	default: { request: (...args: any[]) => requestSpy(...args) },
	requestEndpoint: (endpoint: string, options: any) => ({ endpoint, ...options }),
}));

// Passthrough so the test isolates the index handling in useTemplateData.
vi.mock('@/utils/adjust-fields-for-displays', () => ({
	adjustFieldsForDisplays: (fields: readonly string[]) => [...fields],
}));

const TestComponent = defineComponent({
	props: ['collection', 'primaryKey', 'template'], // eslint-disable-line vue/require-prop-types
	setup(props) {
		return useTemplateData(ref(props.collection), ref(props.primaryKey), { template: ref(props.template) });
	},
	render: () => '',
});

async function requestedFieldsFor(template: string): Promise<string[]> {
	mount(TestComponent, {
		props: {
			collection: { collection: 'articles', meta: {} },
			primaryKey: '1',
			template,
		},
	});

	await flushPromises();

	expect(requestSpy).toHaveBeenCalled();
	return requestSpy.mock.calls[0]![0].params.fields;
}

describe('useTemplateData', () => {
	beforeEach(() => {
		requestSpy.mockClear();
	});

	test('strips bracket array indexing from relational fields requested from the API', async () => {
		const fields = await requestedFieldsFor('https://example.com/preview?lang={{ locale[0].name }}');

		// The API `fields` parser cannot resolve `[0]`, so the relation must be requested without the
		// index. The index is applied later when the template is rendered against the fetched data.
		expect(fields).toEqual(['locale.name']);
	});

	test('strips dot array indexing from relational fields requested from the API', async () => {
		const fields = await requestedFieldsFor('https://example.com/preview?lang={{ locale.0.name }}');

		expect(fields).toEqual(['locale.name']);
	});

	test('leaves non-indexed relational fields untouched', async () => {
		const fields = await requestedFieldsFor('https://example.com/preview/{{ slug.navigation_items_id.url }}');

		expect(fields).toEqual(['slug.navigation_items_id.url']);
	});
});
