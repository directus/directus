<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import { useSync } from '@directus/composables';
import type { Field, ShowSelect } from '@directus/types';
import { computed } from 'vue';

const props = withDefaults(
	defineProps<{
		fields: Field[];
		size: number;
		sort: string[];
		showSelect?: ShowSelect;
		selection?: (number | string)[];
	}>(),
	{
		showSelect: 'multiple',
		selection: () => [],
	},
);

const emit = defineEmits(['select-all', 'update:size', 'update:sort', 'update:selection']);

const sizeSync = useSync(props, 'size', emit);
const sortSync = useSync(props, 'sort', emit);
const selectionSync = useSync(props, 'selection', emit);

const descending = computed(() => props.sort[0]?.startsWith('-'));

const sortKey = computed(() => (props.sort[0]?.startsWith('-') ? props.sort[0].substring(1) : props.sort[0]));

const sortField = computed(() => {
	return props.fields.find((field) => field.field === sortKey.value);
});

const fieldsWithoutFake = computed(() => {
	return props.fields
		.filter((field) => field.field.startsWith('$') === false)
		.map((field) => ({
			field: field.field,
			name: field.name,
			disabled: ['json', 'o2m', 'm2o', 'm2a', 'file', 'files', 'alias', 'presentation'].includes(field.type),
		}));
});

function toggleSize() {
	if (props.size >= 2 && props.size < 5) {
		sizeSync.value++;
	} else {
		sizeSync.value = 2;
	}
}

function toggleDescending() {
	if (descending.value === true) {
		sortSync.value = [sortSync.value[0].substring(1)];
	} else {
		sortSync.value = ['-' + sortSync.value];
	}
}

function onClickSelect() {
	if (selectionSync.value.length) selectionSync.value = [];
	else if (props.showSelect === 'multiple') emit('select-all');
}
</script>

<template>
	<div class="cards-header">
		<div class="start">
			<button type="button" :class="{ 'no-selection': !selectionSync.length }" @click="onClickSelect">
				<template v-if="selectionSync.length">
					<VIcon name="cancel" outline />
					<span class="label">{{ $t('n_items_selected', selectionSync.length) }}</span>
				</template>
				<template v-else>
					<VIcon name="check_circle" outline />
					<span class="label">{{ $t(showSelect === 'multiple' ? 'select_all' : 'select_an_item') }}</span>
				</template>
			</button>
		</div>
		<div class="end">
			<VIcon
				v-tooltip.top="$t('card_size')"
				class="size-selector"
				:name="`grid_${7 - size}`"
				clickable
				@click="toggleSize"
			/>

			<VMenu show-arrow placement="bottom">
				<template #activator="{ toggle }">
					<button v-tooltip.top="$t('sort_field')" type="button" class="sort-selector" @click="toggle">
						{{ sortField && sortField.name }}
					</button>
				</template>

				<VList>
					<VListItem
						v-for="field in fieldsWithoutFake"
						:key="field.field"
						:disabled="field.disabled"
						:active="field.field === sortKey"
						clickable
						@click="sortSync = [field.field]"
					>
						<VListItemContent>{{ field.name }}</VListItemContent>
					</VListItem>
				</VList>
			</VMenu>
			<VIcon
				v-tooltip.top="$t('sort_direction')"
				class="sort-direction"
				:class="{ descending }"
				name="sort"
				clickable
				@click="toggleDescending"
			/>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.cards-header {
	position: sticky;
	inset-block-start: var(--layout-offset-top);
	z-index: 4;
	display: flex;
	align-items: center;
	justify-content: space-between;
	inline-size: 100%;
	block-size: 52px;
	margin-block-end: 36px;
	padding: 0 8px;
	background-color: var(--theme--background);
	border-block-start: var(--theme--border-width) solid var(--theme--border-color-subdued);
	border-block-end: var(--theme--border-width) solid var(--theme--border-color-subdued);
	box-shadow: 0 0 0 2px var(--theme--background);
}

.start {
	.label {
		display: inline-block;
		margin-inline-start: 4px;
		transform: translateY(1px);
	}

	.no-selection {
		color: var(--theme--foreground-subdued);
		transition: color var(--fast) var(--transition);

		&:hover {
			color: var(--theme--foreground);
		}
	}
}

.end {
	display: flex;
	align-items: center;
	color: var(--theme--foreground-subdued);

	.size-selector {
		margin-inline-end: 16px;
		transition: color var(--fast) var(--transition);

		&:hover {
			color: var(--theme--foreground);
		}
	}

	.sort-selector {
		margin-inline-end: 8px;
		transition: color var(--fast) var(--transition);

		&:hover {
			color: var(--theme--foreground);
		}
	}

	.sort-direction {
		transition: color var(--fast) var(--transition);

		&.descending {
			transform: scaleY(-1);
		}

		&:hover {
			color: var(--theme--foreground);
		}
	}
}
</style>
