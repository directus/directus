<template>
	<v-drawer v-model="internalActive" :title="t('select_item')" @cancel="cancel">
		<template #subtitle>
			<v-breadcrumb :items="[{ name: collectionInfo.name, disabled: true }]" />
		</template>

		<template #actions:prepend><component :is="`layout-actions-${localLayout}`" /></template>

		<template #actions>
			<search-input v-model="searchQuery" />

			<v-button @click="save" icon rounded v-tooltip.bottom="t('save')">
				<v-icon name="check" />
			</v-button>
		</template>

		<component class="layout" :is="`layout-${localLayout}`">
			<template #no-results>
				<v-info :title="t('item_count', 0)" :icon="collectionInfo.icon" center />
			</template>

			<template #no-items>
				<v-info :title="t('item_count', 0)" :icon="collectionInfo.icon" center />
			</template>
		</component>
	</v-drawer>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType, ref, reactive, computed, toRefs, watch } from 'vue';
import { Filter } from '@directus/shared/types';
import usePreset from '@/composables/use-preset';
import useCollection from '@/composables/use-collection';
import { useLayout } from '@/composables/use-layout';
import SearchInput from '@/views/private/components/search-input';

export default defineComponent({
	emits: ['update:filters', 'update:active', 'input'],
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
		const { t } = useI18n();

		const { save, cancel } = useActions();
		const { internalActive } = useActiveState();
		const { internalSelection, localSelection, onSelect } = useSelection();

		const { collection } = toRefs(props);

		const { info: collectionInfo } = useCollection(collection);
		const { layout, layoutOptions, layoutQuery, searchQuery } = usePreset(collection, ref(null), true);

		// This is a local copy of the layout. This means that we can sync it the layout without
		// having use-preset auto-save the values
		const localLayout = ref(layout.value || 'tabular');
		const localOptions = ref(layoutOptions.value);
		const localQuery = ref(layoutQuery.value);

		const layoutSelection = computed<any>({
			get() {
				return internalSelection.value;
			},
			set(newFilters) {
				onSelect(newFilters);
			},
		});

		const layoutFilters = computed<Filter[]>({
			get() {
				return props.filters;
			},
			set(newFilters) {
				emit('update:filters', newFilters);
			},
		});

		useLayout(
			localLayout,
			reactive({
				collection,
				selection: layoutSelection,
				layoutOptions: localOptions,
				layoutQuery: localQuery,
				filters: layoutFilters,
				searchQuery,
				selectMode: true,
				readonly: false,
			})
		);

		return {
			t,
			save,
			cancel,
			internalActive,
			internalSelection,
			localSelection,
			onSelect,
			localLayout,
			localOptions,
			collectionInfo,
			searchQuery,
		};

		function useActiveState() {
			const localActive = ref(false);

			const internalActive = computed({
				get() {
					return props.active === undefined ? localActive.value : props.active;
				},
				set(newActive: boolean) {
					localActive.value = newActive;
					emit('update:active', newActive);
				},
			});

			return { internalActive };
		}

		function useSelection() {
			const localSelection = ref<(string | number)[] | null>(null);

			const internalSelection = computed({
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

			return { internalSelection, localSelection, onSelect };

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
				emit('input', internalSelection.value);
				internalActive.value = false;
			}

			function cancel() {
				internalActive.value = false;
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
