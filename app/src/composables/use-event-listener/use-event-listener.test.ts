import { ref } from '@vue/composition-api';
import useEventListener from './use-event-listener';
import mountComposable from '../../../.jest/mount-composable';

describe('Composables / Event Listener', () => {
	it('Adds passed event listener onMounted', () => {
		const map: any = {};

		window.addEventListener = jest.fn((event, cb) => {
			map[event] = cb;
		});

		window.removeEventListener = jest.fn((event) => {
			delete map[event];
		});

		const handler = () => {};

		const component = mountComposable(() => {
			useEventListener(window, 'keydown', handler);
		});

		expect(map.keydown).toBe(handler);

		component.destroy();

		expect(map.keydown).toBe(undefined);
	});

	it('Uses the value if the target is a ref', () => {
		const target = ref(window);
		const map: any = {};

		window.addEventListener = jest.fn((event, cb) => {
			map[event] = cb;
		});

		window.removeEventListener = jest.fn((event) => {
			delete map[event];
		});

		const handler = () => {};

		const component = mountComposable(() => {
			useEventListener(target, 'keydown', handler);
		});

		expect(map.keydown).toBe(handler);

		component.destroy();

		expect(map.keydown).toBe(undefined);
	});
});
