import { mount } from '@vue/test-utils';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, useTemplateRef } from 'vue';
import { useNavScroll } from './use-nav-scroll';

// jsdom has no layout, so scrollTop is always 0 unless it is backed by a value
beforeAll(() => {
	const offsets = new WeakMap<HTMLElement, number>();

	Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
		get(this: HTMLElement) {
			return offsets.get(this) ?? 0;
		},
		set(this: HTMLElement, value: number) {
			offsets.set(this, value);
		},
		configurable: true,
	});
});

let path = '/content/collection_01';

vi.mock('vue-router', () => ({
	useRoute: () => ({
		get path() {
			return path;
		},
	}),
}));

const TestComponent = defineComponent({
	setup() {
		const element = useTemplateRef<HTMLDivElement>('content');
		useNavScroll(element);
		return () => h('div', { ref: 'content' });
	},
});

async function mountNav() {
	const wrapper = mount(TestComponent, { attachTo: document.body });
	await nextTick();
	return { wrapper, element: wrapper.element as HTMLDivElement };
}

function scrollTo(element: HTMLDivElement, offset: number) {
	element.scrollTop = offset;
	element.dispatchEvent(new Event('scroll'));
}

describe('useNavScroll', () => {
	it('restores the offset when the navigation is re-created within the same module', async () => {
		path = '/content/collection_01';

		const first = await mountNav();
		scrollTo(first.element, 120);
		first.wrapper.unmount();

		path = '/content/collection_02';

		const second = await mountNav();

		expect(second.element.scrollTop).toBe(120);

		second.wrapper.unmount();
	});

	it('does not restore an offset from another module', async () => {
		path = '/files';

		const files = await mountNav();
		scrollTo(files.element, 90);
		files.wrapper.unmount();

		path = '/insights';

		const insights = await mountNav();

		expect(insights.element.scrollTop).toBe(0);

		insights.wrapper.unmount();
	});

	it('keeps a separate offset per module', async () => {
		path = '/users';

		const users = await mountNav();
		scrollTo(users.element, 60);
		users.wrapper.unmount();

		path = '/activity';

		const activity = await mountNav();
		scrollTo(activity.element, 200);
		activity.wrapper.unmount();

		path = '/users/some-user';

		const usersAgain = await mountNav();

		expect(usersAgain.element.scrollTop).toBe(60);

		usersAgain.wrapper.unmount();
	});
});
