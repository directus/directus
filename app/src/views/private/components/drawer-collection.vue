<script setup lang="ts">
import { useCollection, useLayout } from '@directus/composables';
import { Filter } from '@directus/types';
import { mergeFilters } from '@directus/utils';
import { isEqual } from 'lodash';
import { computed, ref, toRefs, unref, watch } from 'vue';
import PrivateViewHeaderBarActionButton from '../private-view/components/private-view-header-bar-action-button.vue';
import VBreadcrumb from '@/components/v-breadcrumb.vue';
import type { Props as VDrawerProps } from '@/components/v-drawer.vue';
import VDrawer from '@/components/v-drawer.vue';
import VInfo from '@/components/v-info.vue';
import { usePreset } from '@/composables/use-preset';
import SearchInput from '@/views/private/components/search-input.vue';

const props = withDefaults(
	defineProps<{
		active?: boolean;
		selection?: (number | string)[];
		collection: string;
		multiple?: boolean;
		filter?: Filter;
		drawerProps?: VDrawerProps;
	}>(),
	{
		selection: () => [],
	},
);

const emit = defineEmits<{
	(e: 'update:active', value: boolean): void;
	(e: 'input', value: (number | string)[] | null): void;
}>();

const { save, cancel } = useActions();
const { internalActive } = useActiveState();
const { internalSelection, onSelect, hasSelectionChanged } = useSelection();

const { collection } = toRefs(props);

const { info: collectionInfo } = useCollection(collection);
const { layout, layoutOptions, layoutQuery, search, filter: presetFilter } = usePreset(collection, ref(null), true);

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

const { layoutWrapper } = useLayout(layout);

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
	const initialSelection = ref<(string | number)[] | null>(null);

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

	const hasSelectionChanged = computed(() => {
		return !isEqual(internalSelection.value, initialSelection.value);
	});

	watch(
		() => props.active,
		(active) => {
			localSelection.value = null;

			if (active) {
				// Store a copy of the initial selection when the drawer opens
				initialSelection.value = Array.isArray(internalSelection.value)
					? [...internalSelection.value]
					: internalSelection.value;
			}
		},
	);

	return { internalSelection, onSelect, hasSelectionChanged };

	function onSelect(newSelection: (string | number)[]) {
		if (newSelection.length === 0) {
			localSelection.value = [];
			return;
		}

		if (props.multiple === true) {
			localSelection.value = newSelection;
		} else {
			localSelection.value = [newSelection[newSelection.length - 1] as string | number];
		}
	}
}

function useActions() {
	return { save, cancel };

	function save() {
		if (!hasSelectionChanged.value) return;
		emit('input', unref(internalSelection));
		internalActive.value = false;
	}

	function cancel() {
		internalActive.value = false;
	}
}
</script>

<template>
	<component
		:is="layoutWrapper"
		v-slot="{ layoutState }"
		v-model:selection="layoutSelection"
		v-model:layout-options="localOptions"
		v-model:layout-query="localQuery"
		:filter="mergeFilters(presetFilter, filter ?? null)"
		:filter-user="presetFilter"
		:filter-system="filter"
		:search="search"
		:collection="collection"
		select-mode
		:show-select="multiple ? 'multiple' : 'one'"
	>
		<VDrawer
			v-model="internalActive"
			:title="$t('select_item')"
			:icon="collectionInfo!.icon"
			v-bind="drawerProps"
			@cancel="cancel"
			@apply="save"
		>
			<template v-for="(_, slot) of $slots" #[slot]="scope">
				<slot :name="slot" v-bind="scope" />
			</template>

			<template #subtitle>
				<VBreadcrumb :items="[{ name: collectionInfo!.name, disabled: true }]" />
			</template>

			<template #actions:prepend><component :is="`layout-actions-${localLayout}`" v-bind="layoutState" /></template>

			<template #actions>
				<SearchInput v-model="search" v-model:filter="presetFilter" :collection="collection" />

				<PrivateViewHeaderBarActionButton
					v-tooltip.bottom="$t('save')"
					:disabled="!hasSelectionChanged"
					icon="check"
					@click="save"
				/>
			</template>

			<div class="layout">
				<component :is="`layout-${localLayout}`" v-bind="layoutState">
					<template #no-results>
						<VInfo :title="$t('item_count', 0)" :icon="collectionInfo!.icon" center />
					</template>

					<template #no-items>
						<VInfo :title="$t('item_count', 0)" :icon="collectionInfo!.icon" center />
					</template>
				</component>
			</div>
		</VDrawer>
	</component>
</template>

<style lang="scss" scoped>
.layout {
	display: contents;

	--layout-offset-top: calc(var(--header-bar-height) - 1px);
}
</style>
