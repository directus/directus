import mountComposable from '../../../.jest/mount-composable';
import useElementSize from './use-element-size';
import { ResizeObserver } from 'resize-observer';
import { ref } from '@vue/composition-api';

jest.mock('resize-observer');

const mockResizeObserver = {
	observe: jest.fn(),
	disconnect: jest.fn(),
};

describe('Composables / useElementSize', () => {
	beforeEach(() => {
		(ResizeObserver as jest.Mock).mockImplementation(() => {
			return mockResizeObserver;
		});
	});

	it('Creates a resize observer', () => {
		const el = document.createElement('div');

		mountComposable(() => {
			useElementSize(el);
		});

		expect(ResizeObserver).toHaveBeenCalled();
	});

	it('Calls observe with the passed element on mount', () => {
		const el = document.createElement('div');

		mountComposable(() => {
			useElementSize(el);
		});

		expect(mockResizeObserver.observe).toHaveBeenCalledWith(el);
	});

	it('Calls observer with element if ref is passed', () => {
		const el = document.createElement('div');

		mountComposable(() => {
			const refEl = ref<Element>(el);
			useElementSize(refEl);
		});

		expect(mockResizeObserver.observe).toHaveBeenCalledWith(el);
	});

	it('Does not call observe when passed element is null or undefined', () => {
		mountComposable(() => {
			useElementSize(ref(null));
		});

		expect(mockResizeObserver.observe).not.toHaveBeenCalled();
	});

	it('Calls disconnect on unmount', () => {
		const el = document.createElement('div');

		mountComposable(() => {
			useElementSize(el);
		}).destroy();

		expect(mockResizeObserver.disconnect).toHaveBeenCalled();
	});

	it('Sets the returned width and height refs on ResizeObserver handler', () => {
		let handler: (_: any) => void;

		(ResizeObserver as jest.Mock).mockImplementation((constructorParam) => {
			handler = constructorParam;
			return mockResizeObserver;
		});

		const el = document.createElement('div');

		mountComposable(() => {
			const { width, height } = useElementSize(el);
			expect(width.value).toBe(0);
			expect(height.value).toBe(0);

			handler([
				{
					contentRect: {
						width: 150,
						height: 150,
					},
				},
			]);

			expect(width.value).toBe(150);
			expect(height.value).toBe(150);
		});
	});
});
