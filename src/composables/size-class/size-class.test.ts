import useSizeClass from './size-class';
import mountComposable from '../../../.jest/mount-composable';

describe('Composables / Size Class', () => {
	it('Extracts the correct class based on given props', () => {
		let props = {
			xSmall: false,
			small: false,
			large: false,
			xLarge: false,
			ignoredKey: 'test',
		};

		mountComposable(() => {
			const className = useSizeClass(props);
			expect(className.value).toBe(null);
		}).destroy();

		props = {
			xSmall: true,
			small: false,
			large: false,
			xLarge: false,
			ignoredKey: 'test',
		};

		mountComposable(() => {
			const className = useSizeClass(props);
			expect(className.value).toBe('x-small');
		}).destroy();

		props = {
			xSmall: false,
			small: true,
			large: false,
			xLarge: false,
			ignoredKey: 'test',
		};

		mountComposable(() => {
			const className = useSizeClass(props);
			expect(className.value).toBe('small');
		}).destroy();

		props = {
			xSmall: false,
			small: false,
			large: true,
			xLarge: false,
			ignoredKey: 'test',
		};

		mountComposable(() => {
			const className = useSizeClass(props);
			expect(className.value).toBe('large');
		}).destroy();

		props = {
			xSmall: false,
			small: false,
			large: false,
			xLarge: true,
			ignoredKey: 'test',
		};

		mountComposable(() => {
			const className = useSizeClass(props);
			expect(className.value).toBe('x-large');
		}).destroy();
	});

	it('Defaults to the smallest size if multiple sizes are passed', () => {
		const props = {
			xSmall: false,
			small: true,
			large: true,
			xLarge: true,
			ignoredKey: 'test',
		};

		mountComposable(() => {
			const className = useSizeClass(props);
			expect(className.value).toBe('small');
		}).destroy();
	});
});
