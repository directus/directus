<template>
	<component
		:is="layoutWrapper"
		v-slot="{ layoutState }"
		v-model:selection="layoutSelection"
		v-model:layout-options="localOptions"
		v-model:layout-query="localQuery"
		:filter="mergeFilters(presetFilter, filter)"
		:filter-user="presetFilter"
		:filter-system="filter"
		:search="search"
		:collection="collection"
		select-mode
		:show-select="multiple ? 'multiple' : 'one'"
	>
		<v-drawer
			v-model="internalActive"
			:title="t('select_item')"
			:small-header="currentLayout?.smallHeader"
			:header-shadow="currentLayout?.headerShadow"
			v-bind="drawerProps"
			@cancel="cancel"
		>
			<template v-for="(_, slot) of $slots" #[slot]="scope">
				<slot :name="slot" v-bind="scope" />
			</template>

			<template #subtitle>
				<v-breadcrumb :items="[{ name: collectionInfo!.name, disabled: true }]" />
			</template>

			<template #title-outer:prepend>
				<v-button class="header-icon" rounded icon secondary disabled>
					<v-icon :name="collectionInfo!.icon" :color="collectionInfo!.color" />
				</v-button>
			</template>

			<template #actions:prepend><component :is="`layout-actions-${localLayout}`" v-bind="layoutState" /></template>

			<template #actions>
				<search-input v-model="search" v-model:filter="presetFilter" :collection="collection" />

				<v-button v-tooltip.bottom="t('save')" icon rounded @click="save">
					<v-icon name="check" />
				</v-button>
			</template>

			<div class="layout">
				<component :is="`layout-${localLayout}`" v-bind="layoutState">
					<template #no-results>
						<v-info :title="t('item_count', 0)" :icon="collectionInfo!.icon" center />
					</template>

					<template #no-items>
						<v-info :title="t('item_count', 0)" :icon="collectionInfo!.icon" center />
					</template>
				</component>
			</div>
		</v-drawer>
	</component>
</template>

<script setup lang="ts">
import { useExtension } from '@/composables/use-extension';
import { usePreset } from '@/composables/use-preset';
import SearchInput from '@/views/private/components/search-input.vue';
import { useCollection, useLayout } from '@directus/composables';
import { Filter } from '@directus/types';
import { computed, ref, toRefs, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Props as VDrawerProps } from '@/components/v-drawer.vue';
import { mergeFilters } from '@directus/utils';

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
	}
);

const emit = defineEmits<{
	(e: 'update:active', value: boolean): void;
	(e: 'input', value: (number | string)[] | null): void;
}>();

const { t } = useI18n();

const { save, cancel } = useActions();
const { internalActive } = useActiveState();
const { internalSelection, onSelect } = useSelection();

const { collection } = toRefs(props);

const { info: collectionInfo } = useCollection(collection);
const { layout, layoutOptions, layoutQuery, search, filter: presetFilter } = usePreset(collection, ref(null), true);

// This is a local copy of the layout. This means that we can sync it the layout without
// having use-preset auto-save the values
const localLayout = ref(layout.value || 'tabular');
const localOptions = ref(layoutOptions.value);
const localQuery = ref(layoutQuery.value);

const currentLayout = useExtension('layout', localLayout);

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

	return { internalSelection, onSelect };

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
		emit('input', unref(internalSelection));
		internalActive.value = false;
	}

	function cancel() {
		internalActive.value = false;
	}
}
</script>

<style lang="scss" scoped>
.layout {
	display: contents;
	--layout-offset-top: calc(var(--header-bar-height) - 1px);
}
</style>
