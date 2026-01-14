import { mount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';
import HelperText from './helper-text.vue';

const mountOptions = {
	props: {
		content: '<h1>test</h1>',
	},
};

describe('basic rendering', () => {
	test('interface mounts', () => {
		const wrapper = mount(HelperText, mountOptions);

		expect(wrapper.exists());
	});

	test('internal html is correct', () => {
		const wrapper = mount(HelperText, mountOptions);

		expect(wrapper.html()).toContain(mountOptions.props.content);
	});

	test('purifies dangerous html', () => {
		const dangerousMountOptions = {
			props: {
				content: '<img src=x onerror=alert(1)//>',
			},
		};

		const wrapper = mount(HelperText, dangerousMountOptions);

		expect(wrapper.html()).toContain('<img src="x">');
	});
});
