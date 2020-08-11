import Vue from 'vue';
import { provide, inject, ref } from '@vue/composition-api';
import mountComposable from '../../../.jest/mount-composable';
import { useGroupable, useGroupableParent } from './groupable';

describe('Groupable', () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('Child', () => {
		it('Returns on-ops if parent injection does not exist or is undefined', () => {
			mountComposable(() => {
				provide('item-group', undefined);
				const { active, toggle } = useGroupable();
				expect(active).toEqual({ value: false });
				expect(toggle).toBeInstanceOf(Function);
			});
		});

		it('Calls register on creation, and unregister on destroy', () => {
			const register = jest.fn();
			const unregister = jest.fn();
			const toggle = jest.fn();

			const component = mountComposable(() => {
				provide('item-group', { register, unregister, toggle });
				useGroupable();
			});

			expect(register).toHaveBeenCalled();
			component.destroy();
			expect(unregister).toHaveBeenCalled();
		});

		it('Passes the custom value to the parent scope on register', () => {
			const register = jest.fn();
			const unregister = jest.fn();
			const toggle = jest.fn();

			mountComposable(() => {
				provide('item-group', { register, unregister, toggle });
				useGroupable({ value: 'custom-value' });
			});

			expect(register).toHaveBeenCalledWith({
				active: { value: false },
				value: 'custom-value',
			});
		});

		it('Returns the active state and a toggle function on succesful registration', () => {
			const register = jest.fn();
			const unregister = jest.fn();
			const toggle = jest.fn();

			mountComposable(() => {
				provide('item-group', { register, unregister, toggle });
				const result = useGroupable({ value: 'custom-value' });
				expect(result!.active).toEqual({ value: false });
				expect(result!.toggle).toBeInstanceOf(Function);
			});
		});

		it('Calls parent provided toggle on toggle', () => {
			const register = jest.fn();
			const unregister = jest.fn();
			const toggle = jest.fn();

			mountComposable(() => {
				provide('item-group', { register, unregister, toggle });
				const result = useGroupable({ value: 'custom-value' });
				result!.toggle();
				expect(toggle).toHaveBeenCalled();
			});
		});

		it('Sets internal active state on toggle', () => {
			const register = jest.fn();
			const unregister = jest.fn();
			const toggle = jest.fn();

			mountComposable(() => {
				provide('item-group', { register, unregister, toggle });
				const result = useGroupable({ value: 'custom-value' });
				result!.toggle();
				expect(result!.active).toEqual({ value: true });
			});
		});
	});

	describe('Parent', () => {
		describe('Registration', () => {
			it('Provides register, unregister, and toggle functions', () => {
				mountComposable(() => {
					useGroupableParent();

					const providedFunctions: any = inject('item-group');
					expect(providedFunctions).not.toBe(undefined);
					expect(providedFunctions.register).toBeInstanceOf(Function);
					expect(providedFunctions.unregister).toBeInstanceOf(Function);
					expect(providedFunctions.toggle).toBeInstanceOf(Function);
				});
			});

			it('Adds the registered item to the items array', () => {
				mountComposable(() => {
					const result: any = useGroupableParent();

					const providedFunctions: any = inject('item-group');

					const testItem = {
						active: ref(false),
						value: 'test',
					};

					providedFunctions.register(testItem);
					expect(result.items.value).toEqual([testItem]);
				});
			});

			it('Preselects the first item on first load if mandatory is set', () => {
				mountComposable(() => {
					const result: any = useGroupableParent(undefined, { mandatory: ref(true) });

					const providedFunctions: any = inject('item-group');

					const testItem = {
						active: ref(false),
						value: 'test',
					};

					providedFunctions.register(testItem);
					expect(result.items.value).toEqual([testItem]);
					expect(result.selection.value).toEqual(['test']);
				});
			});

			it('Removes the unregistered item from the items array', () => {
				mountComposable(() => {
					const result: any = useGroupableParent();

					const providedFunctions: any = inject('item-group');

					const testItem = {
						active: ref(false),
						value: 'test',
					};

					result.items.value = [testItem];

					providedFunctions.unregister(testItem);
					expect(result.items.value).toEqual([]);
				});
			});
		});

		describe('Passed in state', () => {
			it('Defaults to internal selection state if no state is provided', () => {
				mountComposable(() => {
					const result: any = useGroupableParent();
					result._selection.value = [0];
					expect(result.selection.value).toEqual([0]);
				});
			});

			it('Uses passed in state if provided', () => {
				mountComposable(() => {
					const result: any = useGroupableParent({
						selection: ref([0]),
					});

					expect(result.selection.value).toEqual([0]);
				});
			});

			it('Calls provided onSelectionChange handler on selection changes', () => {
				const onSelectionChange = jest.fn();

				mountComposable(() => {
					const result: any = useGroupableParent({
						onSelectionChange: onSelectionChange,
					});

					result.selection.value = [0];
				});

				expect(onSelectionChange).toHaveBeenCalledWith([0]);
			});

			it('Sets the internal selection state on selection changes', () => {
				mountComposable(() => {
					const result: any = useGroupableParent();

					result.selection.value = [0];

					expect(result._selection.value).toEqual([0]);
				});
			});
		});

		describe('Selections', () => {
			it('Toggles child items on and off when the toggle function is called', () => {
				mountComposable(() => {
					const result: any = useGroupableParent();

					const providedFunctions: any = inject('item-group');

					const testItem = {
						active: ref(false),
						value: 'test',
					};

					providedFunctions.register(testItem);
					providedFunctions.toggle(testItem);
					expect(result.selection.value).toEqual(['test']);
					providedFunctions.toggle(testItem);
					expect(result.selection.value).toEqual([]);
				});
			});

			it('Does not toggle the item off if mandatory is enabled', () => {
				mountComposable(() => {
					const result: any = useGroupableParent(undefined, { mandatory: ref(true) });

					const providedFunctions: any = inject('item-group');

					const testItem = {
						active: ref(false),
						value: 'test',
					};

					providedFunctions.register(testItem);
					providedFunctions.toggle(testItem);
					expect(result.selection.value).toEqual(['test']);
					providedFunctions.toggle(testItem);
					expect(result.selection.value).toEqual(['test']);
				});
			});

			it('Only allows one active item at a time', () => {
				mountComposable(() => {
					const result: any = useGroupableParent();

					const providedFunctions: any = inject('item-group');

					const testItem = {
						active: ref(false),
						value: 'test',
					};

					const testItem2 = {
						active: ref(false),
						value: 'test2',
					};

					providedFunctions.register(testItem);
					providedFunctions.register(testItem2);
					providedFunctions.toggle(testItem);
					expect(result.selection.value).toEqual(['test']);
					providedFunctions.toggle(testItem2);
					expect(result.selection.value).toEqual(['test2']);
				});
			});

			it('Allows multiple items if multiple flag is set', () => {
				mountComposable(() => {
					const result: any = useGroupableParent(undefined, { multiple: ref(true) });

					const providedFunctions: any = inject('item-group');

					const testItem = {
						active: ref(false),
						value: 'test',
					};

					const testItem2 = {
						active: ref(false),
						value: 'test2',
					};

					providedFunctions.register(testItem);
					providedFunctions.register(testItem2);
					providedFunctions.toggle(testItem);
					expect(result.selection.value).toEqual(['test']);
					providedFunctions.toggle(testItem2);
					expect(result.selection.value).toEqual(['test', 'test2']);
				});
			});

			it('Deselects individual items on toggle', () => {
				mountComposable(() => {
					const result: any = useGroupableParent(undefined, { multiple: ref(true) });

					const providedFunctions: any = inject('item-group');

					const testItem = {
						active: ref(false),
						value: 'test',
					};

					const testItem2 = {
						active: ref(false),
						value: 'test2',
					};

					providedFunctions.register(testItem);
					providedFunctions.register(testItem2);
					providedFunctions.toggle(testItem);
					expect(result.selection.value).toEqual(['test']);
					providedFunctions.toggle(testItem2);
					expect(result.selection.value).toEqual(['test', 'test2']);
					providedFunctions.toggle(testItem);
					expect(result.selection.value).toEqual(['test2']);
				});
			});

			it('Stops adding more items if max value is reached', () => {
				mountComposable(() => {
					const result: any = useGroupableParent(undefined, {
						max: ref(2),
						multiple: ref(true),
					});

					const providedFunctions: any = inject('item-group');

					const testItem = {
						active: ref(false),
						value: 'test',
					};

					const testItem2 = {
						active: ref(false),
						value: 'test2',
					};

					const testItem3 = {
						active: ref(false),
						value: 'test3',
					};

					providedFunctions.register(testItem);
					providedFunctions.register(testItem2);
					providedFunctions.register(testItem3);
					providedFunctions.toggle(testItem);
					expect(result.selection.value).toEqual(['test']);
					providedFunctions.toggle(testItem2);
					expect(result.selection.value).toEqual(['test', 'test2']);
					providedFunctions.toggle(testItem3);
					expect(result.selection.value).toEqual(['test', 'test2']);
				});
			});

			it('Disregards max option is option is set to -1', () => {
				mountComposable(() => {
					const result: any = useGroupableParent(undefined, {
						multiple: ref(true),
						max: ref(-1),
					});

					const providedFunctions: any = inject('item-group');

					const testItem = {
						active: ref(false),
						value: 'test',
					};

					const testItem2 = {
						active: ref(false),
						value: 'test2',
					};

					providedFunctions.register(testItem);
					providedFunctions.register(testItem2);
					providedFunctions.toggle(testItem);
					expect(result.selection.value).toEqual(['test']);
					providedFunctions.toggle(testItem2);
					expect(result.selection.value).toEqual(['test', 'test2']);
				});
			});

			it('Does not let you remove the last item if multiple and mandatory is set', () => {
				mountComposable(() => {
					const result: any = useGroupableParent(undefined, {
						mandatory: ref(true),
						multiple: ref(true),
					});

					const providedFunctions: any = inject('item-group');

					const testItem = {
						active: ref(false),
						value: 'test',
					};

					const testItem2 = {
						active: ref(false),
						value: 'test2',
					};

					const testItem3 = {
						active: ref(false),
						value: 'test3',
					};

					providedFunctions.register(testItem);
					providedFunctions.register(testItem2);
					providedFunctions.register(testItem3);
					providedFunctions.toggle(testItem);
					expect(result.selection.value).toEqual(['test']);
					providedFunctions.toggle(testItem2);
					expect(result.selection.value).toEqual(['test', 'test2']);
					providedFunctions.toggle(testItem3);
					expect(result.selection.value).toEqual(['test', 'test2', 'test3']);
					providedFunctions.toggle(testItem3);
					providedFunctions.toggle(testItem2);
					providedFunctions.toggle(testItem);
					expect(result.selection.value).toEqual(['test']);
				});
			});
		});

		describe('updateChildren', () => {
			it('Sets the children item states based on selection', () => {
				mountComposable(async () => {
					const result: any = useGroupableParent();
					const providedFunctions: any = inject('item-group');

					const testItem = {
						active: ref(false),
						value: 'test',
					};

					const testItem2 = {
						active: ref(false),
						value: 'test2',
					};

					const testItem3 = {
						active: ref(true),
					};

					providedFunctions.register(testItem);
					providedFunctions.register(testItem2);
					providedFunctions.register(testItem3);

					result.selection.value = ['test', 2];
					await Vue.nextTick(); // waits for the watch handler to kick in
					expect(testItem.active.value).toBe(true);
					expect(testItem2.active.value).toBe(false);
					expect(testItem3.active.value).toBe(true);

					result.selection.value = [];
					await Vue.nextTick();
					expect(testItem.active.value).toBe(false);
					expect(testItem2.active.value).toBe(false);
					expect(testItem3.active.value).toBe(false);
				});
			});
		});

		it('Extracts the right value for a given item', () => {
			mountComposable(() => {
				const result: any = useGroupableParent();

				const providedFunctions: any = inject('item-group');

				const testItem = {
					active: ref(false),
					value: 'test',
				};

				const testItem2 = {
					active: ref(false),
					value: 'test2',
				};

				const testItem3 = {
					active: ref(false),
				};

				providedFunctions.register(testItem);
				providedFunctions.register(testItem2);
				providedFunctions.register(testItem3);

				expect(result.getValueForItem(testItem2)).toBe('test2');
				expect(result.getValueForItem(testItem3)).toBe(2);
			});
		});
	});
});
