<template>
	<v-drawer v-model="_active" :title="$t('select_item')" @cancel="cancel">
		<template #subtitle>
			<v-breadcrumb :items="[{ name: collectionInfo.name, disabled: true }]" />
		</template>

		<template #actions:prepend><portal-target name="actions:prepend" /></template>

		<template #actions>
			<search-input v-model="searchQuery" />

			<v-button @click="save" icon rounded v-tooltip.bottom="$t('save')">
				<v-icon name="check" />
			</v-button>
		</template>

		<component
			:is="`layout-${localLayout}`"
			:collection="collection"
			:selection="_selection"
			:filters="filters"
			:layout-query.sync="localQuery"
			:layout-options.sync="localOptions"
			:search-query="searchQuery"
			@update:selection="onSelect"
			@update:filters="$emit('update:filters', $event)"
			select-mode
			class="layout"
		>
			<template #no-results>
				<v-info :title="$tc('item_count', 0)" :icon="collectionInfo.icon" center />
			</template>

			<template #no-items>
				<v-info :title="$tc('item_count', 0)" :icon="collectionInfo.icon" center />
			</template>
		</component>
	</v-drawer>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed, toRefs, watch } from '@vue/composition-api';
import { Filter } from '@/types';
import usePreset from '@/composables/use-preset';
import useCollection from '@/composables/use-collection';
import SearchInput from '@/views/private/components/search-input';

export default defineComponent({
	components: { SearchInput },
	props: {
		active: {
			type: Boolean,
			default: false,
		},
		selection: {
			type: Array as PropType<(number | string)[]>,
			default: () => [],
		},
		collection: {
			type: String,
			required: true,
		},
		multiple: {
			type: Boolean,
			default: false,
		},
		filters: {
			type: Array as PropType<Filter[]>,
			default: () => [],
		},
	},
	setup(props, { emit }) {
		const { save, cancel } = useActions();
		const { _active } = useActiveState();
		const { _selection, localSelection, onSelect } = useSelection();

		const { collection } = toRefs(props);

		const { info: collectionInfo } = useCollection(collection);
		const { layout, layoutOptions, layoutQuery, searchQuery } = usePreset(collection, ref(null), true);

		// This is a local copy of the layout. This means that we can sync it the layout without
		// having use-preset auto-save the values
		const localLayout = ref(layout.value || 'tabular');
		const localOptions = ref(layoutOptions.value);
		const localQuery = ref(layoutQuery.value);

		return {
			save,
			cancel,
			_active,
			_selection,
			localSelection,
			onSelect,
			localLayout,
			localOptions,
			localQuery,
			collectionInfo,
			searchQuery,
		};

		function useActiveState() {
			const localActive = ref(false);

			const _active = computed({
				get() {
					return props.active === undefined ? localActive.value : props.active;
				},
				set(newActive: boolean) {
					localActive.value = newActive;
					emit('update:active', newActive);
				},
			});

			return { _active };
		}

		function useSelection() {
			const localSelection = ref<(string | number)[] | null>(null);

			const _selection = computed({
				get() {
					if (localSelection.value === null) {
						return props.selection;
					}

					return localSelection.value;
				},
				set(newSelection: (string | number)[]) {
					localSelection.value = newSelection;
				},
			});

			watch(
				() => props.active,
				() => {
					localSelection.value = null;
				}
			);

			return { _selection, localSelection, onSelect };

			function onSelect(newSelection: (string | number)[]) {
				if (newSelection.length === 0) {
					localSelection.value = [];
					return;
				}

				if (props.multiple === true) {
					localSelection.value = newSelection;
				} else {
					localSelection.value = [newSelection[newSelection.length - 1]];
				}
			}
		}

		function useActions() {
			return { save, cancel };

			function save() {
				emit('input', _selection.value);
				_active.value = false;
			}

			function cancel() {
				_active.value = false;
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.layout {
	--layout-offset-top: 0px;
}
</style>
