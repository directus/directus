import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createI18n } from 'vue-i18n';
import FormattedValue from './formatted-value.vue';

type FormattedValueProps = InstanceType<typeof FormattedValue>['$props'];

const i18n = createI18n({
	legacy: false,
	missingWarn: false,
	locale: 'en-US',
	messages: { 'en-US': {} },
});

function mountFormattedValue(props: FormattedValueProps) {
	return mount(FormattedValue, {
		props,
		global: {
			plugins: [i18n],
			stubs: {
				VIcon: true,
				ValueNull: true,
			},
		},
	});
}

function getDisplayText(props: FormattedValueProps) {
	const wrapper = mountFormattedValue(props);
	const value = wrapper.find('.value');

	if (!value.exists()) return null;

	return value.text();
}

describe('decimal formatting', () => {
	it('preserves decimal places with format enabled', () => {
		const text = getDisplayText({ type: 'decimal', value: '123.456', format: true });
		expect(text).toBe('123.456');
	});

	it('displays raw value without format', () => {
		const text = getDisplayText({ type: 'decimal', value: '3.14' });
		expect(text).toBe('3.14');
	});
});

describe('bigInteger formatting', () => {
	it('formats with locale separators', () => {
		const text = getDisplayText({ type: 'bigInteger', value: '1000000', format: true });
		expect(text).toBe('1,000,000');
	});

	it('handles values beyond Number.MAX_SAFE_INTEGER', () => {
		const text = getDisplayText({ type: 'bigInteger', value: '9007199254740993', format: true });
		expect(text).toBe('9,007,199,254,740,993');
	});

	it('leaves invalid bigint strings as-is', () => {
		const text = getDisplayText({ type: 'bigInteger', value: 'not-a-number', format: true });
		expect(text).toBe('not-a-number');
	});

	it('displays raw value without format', () => {
		const text = getDisplayText({ type: 'bigInteger', value: '12345' });
		expect(text).toBe('12345');
	});
});

describe('bigInteger conditional formatting', () => {
	it('matches eq on large values', () => {
		const wrapper = mountFormattedValue({
			type: 'bigInteger',
			value: '9007199254740993',
			conditionalFormatting: [
				{ operator: 'eq', value: '9007199254740993', color: 'red', background: '', text: '', icon: '' },
			],
		});

		expect(wrapper.find('.display-formatted').attributes('style')).toContain('red');
	});

	it('does not match different large values as eq', () => {
		const wrapper = mountFormattedValue({
			type: 'bigInteger',
			value: '9007199254740993',
			conditionalFormatting: [
				{ operator: 'eq', value: '9007199254740994', color: 'red', background: '', text: '', icon: '' },
			],
		});

		expect(wrapper.find('.display-formatted').attributes('style') ?? '').not.toContain('red');
	});

	it('compares gt correctly for large values', () => {
		const wrapper = mountFormattedValue({
			type: 'bigInteger',
			value: '9007199254740994',
			conditionalFormatting: [
				{ operator: 'gt', value: '9007199254740993', color: 'green', background: '', text: '', icon: '' },
			],
		});

		expect(wrapper.find('.display-formatted').attributes('style')).toContain('green');
	});

	it('returns false for invalid bigint in condition', () => {
		const wrapper = mountFormattedValue({
			type: 'bigInteger',
			value: 'abc',
			conditionalFormatting: [{ operator: 'eq', value: '123', color: 'red', background: '', text: '', icon: '' }],
		});

		expect(wrapper.find('.display-formatted').attributes('style') ?? '').not.toContain('red');
	});
});

describe('decimal conditional formatting', () => {
	it('matches eq on decimal values', () => {
		const wrapper = mountFormattedValue({
			type: 'decimal',
			value: '3.14',
			conditionalFormatting: [{ operator: 'eq', value: '3.14', color: 'blue', background: '', text: '', icon: '' }],
		});

		expect(wrapper.find('.display-formatted').attributes('style')).toContain('blue');
	});

	it('compares gt correctly for decimals', () => {
		const wrapper = mountFormattedValue({
			type: 'decimal',
			value: '1.5',
			conditionalFormatting: [{ operator: 'gt', value: '1.4', color: 'green', background: '', text: '', icon: '' }],
		});

		expect(wrapper.find('.display-formatted').attributes('style')).toContain('green');
	});

	it('does not match when decimal comparison fails', () => {
		const wrapper = mountFormattedValue({
			type: 'decimal',
			value: '1.5',
			conditionalFormatting: [{ operator: 'lt', value: '1.4', color: 'red', background: '', text: '', icon: '' }],
		});

		expect(wrapper.find('.display-formatted').attributes('style') ?? '').not.toContain('red');
	});
});

describe('string/text formatting', () => {
	it('applies formatTitle with format enabled', () => {
		const text = getDisplayText({ type: 'string', value: 'hello_world', format: true });
		expect(text).toBe('Hello World');
	});

	it('displays raw value without format', () => {
		const text = getDisplayText({ type: 'string', value: 'hello_world' });
		expect(text).toBe('hello_world');
	});
});

describe('prefix and suffix', () => {
	it('applies prefix and suffix to decimal', () => {
		const text = getDisplayText({ type: 'decimal', value: '9.99', prefix: '$', suffix: ' USD' });
		expect(text).toBe('$9.99 USD');
	});

	it('applies prefix and suffix to bigInteger', () => {
		const text = getDisplayText({ type: 'bigInteger', value: '1000', prefix: '#' });
		expect(text).toBe('#1000');
	});
});
