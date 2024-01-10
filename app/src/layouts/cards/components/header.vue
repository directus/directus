<script setup lang="ts">
import { useSync } from '@directus/composables';
import type { ShowSelect } from '@directus/extensions';
import type { Field } from '@directus/types';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

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

const { t } = useI18n();

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
</script>

<template>
	<div class="cards-header">
		<div class="start">
			<div v-if="selectionSync.length > 0" class="selected" @click="selectionSync = []">
				<v-icon name="cancel" outline />
				<span class="label">{{ t('n_items_selected', selectionSync.length) }}</span>
			</div>
			<button v-else class="select-all" @click="showSelect === 'multiple' ? $emit('select-all') : undefined">
				<v-icon name="check_circle" outline />
				<span class="label">{{ t(showSelect === 'multiple' ? 'select_all' : 'select_an_item') }}</span>
			</button>
		</div>
		<div class="end">
			<v-icon
				v-tooltip.top="t('card_size')"
				class="size-selector"
				:name="`grid_${7 - size}`"
				clickable
				@click="toggleSize"
			/>

			<v-menu show-arrow placement="bottom">
				<template #activator="{ toggle }">
					<div v-tooltip.top="t('sort_field')" class="sort-selector" @click="toggle">
						{{ sortField && sortField.name }}
					</div>
				</template>

				<v-list>
					<v-list-item
						v-for="field in fieldsWithoutFake"
						:key="field.field"
						:disabled="field.disabled"
						:active="field.field === sortKey"
						clickable
						@click="sortSync = [field.field]"
					>
						<v-list-item-content>{{ field.name }}</v-list-item-content>
					</v-list-item>
				</v-list>
			</v-menu>
			<v-icon
				v-tooltip.top="t('sort_direction')"
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
	top: var(--layout-offset-top);
	z-index: 4;
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	height: 52px;
	margin-bottom: 36px;
	padding: 0 8px;
	background-color: var(--theme--background);
	border-top: var(--theme--border-width) solid var(--theme--border-color-subdued);
	border-bottom: var(--theme--border-width) solid var(--theme--border-color-subdued);
	box-shadow: 0 0 0 2px var(--theme--background);
}

.start {
	.label {
		display: inline-block;
		margin-left: 4px;
		transform: translateY(1px);
	}

	.select-all {
		color: var(--theme--foreground-subdued);
		transition: color var(--fast) var(--transition);

		&:hover {
			color: var(--theme--foreground);
		}
	}

	.selected {
		cursor: pointer;
	}
}

.end {
	display: flex;
	align-items: center;
	color: var(--theme--foreground-subdued);

	.size-selector {
		margin-right: 16px;
		transition: color var(--fast) var(--transition);

		&:hover {
			color: var(--theme--foreground);
		}
	}

	.sort-selector {
		margin-right: 8px;
		transition: color var(--fast) var(--transition);

		&:hover {
			color: var(--theme--foreground);
			cursor: pointer;
		}
	}

	.sort-direction {
		transition: color var(--fast) var(--transition);

		&.descending {
			transform: scaleY(-1);
		}

		&:hover {
			color: var(--theme--foreground);
			cursor: pointer;
		}
	}
}
</style>
