import { describe, expect, it, vi } from 'vitest';
import { nextTick, reactive } from 'vue';
import { useSync } from './use-sync.js';

describe('useSync', () => {
	describe('Basic functionality', () => {
		it('should return a computed ref with getter that returns prop value', () => {
			const props = { modelValue: 'initial value', disabled: false };
			const emit = vi.fn();

			const syncedRef = useSync(props, 'modelValue', emit);

			expect(syncedRef.value).toBe('initial value');
		});

		it('should emit update event when setter is called', () => {
			const props = { modelValue: 'initial', disabled: false };
			const emit = vi.fn();

			const syncedRef = useSync(props, 'modelValue', emit);

			syncedRef.value = 'new value';

			expect(emit).toHaveBeenCalledWith('update:modelValue', 'new value');
			expect(emit).toHaveBeenCalledTimes(1);
		});

		it('should work with different prop keys', () => {
			const props = { title: 'My Title', description: 'My Description' };
			const emit = vi.fn();

			const titleSync = useSync(props, 'title', emit);
			const descriptionSync = useSync(props, 'description', emit);

			expect(titleSync.value).toBe('My Title');
			expect(descriptionSync.value).toBe('My Description');

			titleSync.value = 'New Title';
			descriptionSync.value = 'New Description';

			expect(emit).toHaveBeenCalledWith('update:title', 'New Title');
			expect(emit).toHaveBeenCalledWith('update:description', 'New Description');
			expect(emit).toHaveBeenCalledTimes(2);
		});

		it('should work with boolean values', () => {
			const props = { isVisible: true, isLoading: false };
			const emit = vi.fn();

			const visibleSync = useSync(props, 'isVisible', emit);

			expect(visibleSync.value).toBe(true);

			visibleSync.value = false;

			expect(emit).toHaveBeenCalledWith('update:isVisible', false);
		});

		it('should work with number values', () => {
			const props = { count: 42, max: 100 };
			const emit = vi.fn();

			const countSync = useSync(props, 'count', emit);

			expect(countSync.value).toBe(42);

			countSync.value = 84;

			expect(emit).toHaveBeenCalledWith('update:count', 84);
		});
	});

	describe('Object and array handling', () => {
		it('should work with object values', () => {
			const userData = { name: 'John', email: 'john@example.com', age: 30 };
			const props = { userData, isLoading: false };
			const emit = vi.fn();

			const userDataSync = useSync(props, 'userData', emit);

			expect(userDataSync.value).toEqual(userData);

			const newUserData = { name: 'Jane', email: 'jane@example.com', age: 25 };
			userDataSync.value = newUserData;

			expect(emit).toHaveBeenCalledWith('update:userData', newUserData);
		});

		it('should work with array values', () => {
			const items = ['item1', 'item2', 'item3'];
			const props = { items, selectedIndex: 0 };
			const emit = vi.fn();

			const itemsSync = useSync(props, 'items', emit);

			expect(itemsSync.value).toEqual(items);

			const newItems = ['new1', 'new2'];
			itemsSync.value = newItems;

			expect(emit).toHaveBeenCalledWith('update:items', newItems);
		});

		it('should handle nested object updates', () => {
			const config = { theme: { mode: 'dark', color: 'blue' }, debug: false };
			const props = { config };
			const emit = vi.fn();

			const configSync = useSync(props, 'config', emit);

			const updatedConfig = {
				...config,
				theme: { ...config.theme, mode: 'light' },
			};

			configSync.value = updatedConfig;

			expect(emit).toHaveBeenCalledWith('update:config', updatedConfig);
		});
	});

	describe('Type safety and edge cases', () => {
		it('should handle undefined values', () => {
			const props = { optionalValue: undefined as string | undefined };
			const emit = vi.fn();

			const sync = useSync(props, 'optionalValue', emit);

			expect(sync.value).toBeUndefined();

			sync.value = 'defined value';

			expect(emit).toHaveBeenCalledWith('update:optionalValue', 'defined value');
		});

		it('should handle null values', () => {
			const props = { nullableValue: null as string | null };
			const emit = vi.fn();

			const sync = useSync(props, 'nullableValue', emit);

			expect(sync.value).toBeNull();

			sync.value = 'not null';

			expect(emit).toHaveBeenCalledWith('update:nullableValue', 'not null');
		});

		it('should work with union types', () => {
			const props = { status: 'pending' as 'pending' | 'success' | 'error' };
			const emit = vi.fn();

			const statusSync = useSync(props, 'status', emit);

			expect(statusSync.value).toBe('pending');

			statusSync.value = 'success';

			expect(emit).toHaveBeenCalledWith('update:status', 'success');
		});

		it('should handle empty string values', () => {
			const props = { text: '' };
			const emit = vi.fn();

			const textSync = useSync(props, 'text', emit);

			expect(textSync.value).toBe('');

			textSync.value = 'hello';

			expect(emit).toHaveBeenCalledWith('update:text', 'hello');
		});

		it('should handle zero values', () => {
			const props = { value: 0 };
			const emit = vi.fn();

			const valueSync = useSync(props, 'value', emit);

			expect(valueSync.value).toBe(0);

			valueSync.value = 5;

			expect(emit).toHaveBeenCalledWith('update:value', 5);
		});
	});

	describe('Reactivity behavior', () => {
		it('should reflect prop changes when props are reactive', () => {
			const props = reactive({ value: 'initial' });
			const emit = vi.fn();

			const sync = useSync(props, 'value', emit);

			expect(sync.value).toBe('initial');

			// Simulate parent component updating the prop reactively
			props.value = 'updated from parent';

			expect(sync.value).toBe('updated from parent');
		});

		it('should not emit when prop changes externally', () => {
			const props = { value: 'initial' };
			const emit = vi.fn();

			const sync = useSync(props, 'value', emit);

			// External prop change should not trigger emit
			props.value = 'changed externally';

			// Access the value to ensure computed is evaluated
			expect(sync.value).toBe('changed externally');
			expect(emit).not.toHaveBeenCalled();
		});

		it('should maintain reference equality for object props', () => {
			const originalObject = { name: 'test' };
			const props = { data: originalObject };
			const emit = vi.fn();

			const sync = useSync(props, 'data', emit);

			expect(sync.value).toBe(originalObject);
		});
	});

	describe('Multiple instances', () => {
		it('should handle multiple sync instances on same props object', () => {
			const props = {
				title: 'Title',
				description: 'Description',
				count: 10,
			};

			const emit = vi.fn();

			const titleSync = useSync(props, 'title', emit);
			const descriptionSync = useSync(props, 'description', emit);
			const countSync = useSync(props, 'count', emit);

			expect(titleSync.value).toBe('Title');
			expect(descriptionSync.value).toBe('Description');
			expect(countSync.value).toBe(10);

			titleSync.value = 'New Title';
			descriptionSync.value = 'New Description';
			countSync.value = 20;

			expect(emit).toHaveBeenCalledWith('update:title', 'New Title');
			expect(emit).toHaveBeenCalledWith('update:description', 'New Description');
			expect(emit).toHaveBeenCalledWith('update:count', 20);
			expect(emit).toHaveBeenCalledTimes(3);
		});

		it('should work with different emit functions', () => {
			const props = { value: 'test' };
			const emit1 = vi.fn();
			const emit2 = vi.fn();

			const sync1 = useSync(props, 'value', emit1);
			const sync2 = useSync(props, 'value', emit2);

			sync1.value = 'from sync1';
			sync2.value = 'from sync2';

			expect(emit1).toHaveBeenCalledWith('update:value', 'from sync1');
			expect(emit2).toHaveBeenCalledWith('update:value', 'from sync2');
			expect(emit1).toHaveBeenCalledTimes(1);
			expect(emit2).toHaveBeenCalledTimes(1);
		});
	});

	describe('Integration scenarios', () => {
		it('should work in a typical form component scenario', () => {
			interface FormProps {
				email: string;
				password: string;
				rememberMe: boolean;
			}

			const props: FormProps = {
				email: 'user@example.com',
				password: 'secret123',
				rememberMe: false,
			};

			const emit = vi.fn();

			const emailSync = useSync(props, 'email', emit);
			const passwordSync = useSync(props, 'password', emit);
			const rememberMeSync = useSync(props, 'rememberMe', emit);

			// Simulate form interactions
			emailSync.value = 'newemail@example.com';
			passwordSync.value = 'newsecret456';
			rememberMeSync.value = true;

			expect(emit).toHaveBeenCalledWith('update:email', 'newemail@example.com');
			expect(emit).toHaveBeenCalledWith('update:password', 'newsecret456');
			expect(emit).toHaveBeenCalledWith('update:rememberMe', true);
			expect(emit).toHaveBeenCalledTimes(3);
		});

		it('should work with v-model pattern simulation', async () => {
			const props = { modelValue: 'initial' };
			const emit = vi.fn();

			const modelSync = useSync(props, 'modelValue', emit);

			// Simulate user input
			modelSync.value = 'user typed text';

			await nextTick();

			expect(emit).toHaveBeenCalledWith('update:modelValue', 'user typed text');

			// Simulate parent update (like v-model binding)
			props.modelValue = 'parent updated value';

			expect(modelSync.value).toBe('parent updated value');
		});

		it('should handle rapid successive updates', () => {
			const props = { counter: 0 };
			const emit = vi.fn();

			const counterSync = useSync(props, 'counter', emit);

			// Rapid updates
			counterSync.value = 1;
			counterSync.value = 2;
			counterSync.value = 3;
			counterSync.value = 4;
			counterSync.value = 5;

			expect(emit).toHaveBeenCalledTimes(5);
			expect(emit).toHaveBeenNthCalledWith(1, 'update:counter', 1);
			expect(emit).toHaveBeenNthCalledWith(2, 'update:counter', 2);
			expect(emit).toHaveBeenNthCalledWith(3, 'update:counter', 3);
			expect(emit).toHaveBeenNthCalledWith(4, 'update:counter', 4);
			expect(emit).toHaveBeenNthCalledWith(5, 'update:counter', 5);
		});

		it('should work with complex data structures', () => {
			interface ComplexData {
				user: {
					profile: {
						name: string;
						settings: {
							theme: string;
							notifications: boolean;
						};
					};
				};
				metadata: string[];
			}

			const complexData: ComplexData = {
				user: {
					profile: {
						name: 'John Doe',
						settings: {
							theme: 'dark',
							notifications: true,
						},
					},
				},
				metadata: ['tag1', 'tag2'],
			};

			const props = { data: complexData };
			const emit = vi.fn();

			const dataSync = useSync(props, 'data', emit);

			const updatedData = {
				...complexData,
				user: {
					...complexData.user,
					profile: {
						...complexData.user.profile,
						name: 'Jane Smith',
					},
				},
			};

			dataSync.value = updatedData;

			expect(emit).toHaveBeenCalledWith('update:data', updatedData);
			// Note: The computed ref still returns the original prop value until parent updates it
			expect(dataSync.value).toBe(complexData);
		});

		it('should work with complex data structures using reactive props', () => {
			interface ComplexData {
				user: {
					profile: {
						name: string;
						settings: {
							theme: string;
							notifications: boolean;
						};
					};
				};
				metadata: string[];
			}

			const complexData: ComplexData = {
				user: {
					profile: {
						name: 'John Doe',
						settings: {
							theme: 'dark',
							notifications: true,
						},
					},
				},
				metadata: ['tag1', 'tag2'],
			};

			const props = reactive({ data: complexData });
			const emit = vi.fn();

			const dataSync = useSync(props, 'data', emit);

			const updatedData = {
				...complexData,
				user: {
					...complexData.user,
					profile: {
						...complexData.user.profile,
						name: 'Jane Smith',
					},
				},
			};

			dataSync.value = updatedData;

			expect(emit).toHaveBeenCalledWith('update:data', updatedData);

			// Simulate parent component updating the prop
			props.data = updatedData;
			expect(dataSync.value).toStrictEqual(updatedData);
		});
	});

	describe('Performance considerations', () => {
		it('should not create unnecessary computations', () => {
			const props = { value: 'test' };
			const emit = vi.fn();

			const sync = useSync(props, 'value', emit);

			// Multiple reads should not cause issues
			const value1 = sync.value;
			const value2 = sync.value;
			const value3 = sync.value;

			expect(value1).toBe('test');
			expect(value2).toBe('test');
			expect(value3).toBe('test');
			expect(emit).not.toHaveBeenCalled();
		});

		it('should handle same value assignment efficiently', () => {
			const props = { value: 'test' };
			const emit = vi.fn();

			const sync = useSync(props, 'value', emit);

			// Setting to the same value should still emit (Vue behavior)
			sync.value = 'test';

			expect(emit).toHaveBeenCalledWith('update:value', 'test');
			expect(emit).toHaveBeenCalledTimes(1);
		});
	});
});
