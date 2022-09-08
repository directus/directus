<template>
	<v-notice v-if="!true" type="warning">
		{{ t('relationship_not_setup') }}
	</v-notice>
	<div v-else class="one-to-many">
		<div>
			<template v-if="loading">
				<v-skeleton-loader v-for="n in limit" :key="n" type="block-list-item-dense" />
			</template>

			<v-notice v-else-if="displayItems.length === 0">
				{{ t('no_items') }}
			</v-notice>

			<v-list v-else>
				<v-list-item v-for="element in displayItems" :key="element[primaryKey]" block :dense="true">
					<render-template :collection="collection" :item="element" :template="displayTemplate" />
					<div class="spacer" />
					<v-icon v-tooltip="t('some tooltip')" class="deselect" name="delete" @click.stop="deleteItem(element)" />
				</v-list-item>
			</v-list>

			<div class="actions list">
				<v-button v-if="totalItemCount < limit" @click="$emit('select')">
					{{ t('add_existing') }}
				</v-button>
				<v-button v-if="totalItemCount > 0" @click="$emit('input', undefined)">
					{{ t('clear_items') }}
				</v-button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import useDisplayItems from './use-display-items';

interface Props {
	value: (string | number)[];
	collection: string;
	template: string;
	filter: Record<string, any>;
	limit: number;
}
const props = withDefaults(defineProps<Props>(), {});
const emit = defineEmits(['input', 'select']);

const { t } = useI18n();
const { collection, template, value } = toRefs(props);

const { displayItems, displayTemplate, loading, primaryKey } = useDisplayItems(collection, template, value);
const totalItemCount = computed(() => displayItems.value?.length || 0);

function deleteItem(elem: Record<string, any>) {
	emit(
		'input',
		displayItems.value
			.filter((item) => item[primaryKey.value] !== elem[primaryKey.value])
			.map((item) => item[primaryKey.value])
	);
}
</script>

<style lang="scss" scoped>
.bordered {
	border: var(--border-width) solid var(--border-normal);
	border-radius: var(--border-radius-outline);
	padding: var(--v-card-padding);
}

.v-list {
	margin-top: 8px;
	--v-list-padding: 0 0 4px;

	.v-list-item.deleted {
		--v-list-item-border-color: var(--danger-25);
		--v-list-item-border-color-hover: var(--danger-50);
		--v-list-item-background-color: var(--danger-10);
		--v-list-item-background-color-hover: var(--danger-25);

		::v-deep(.v-icon) {
			color: var(--danger-75);
		}
	}
}

.v-skeleton-loader,
.v-notice {
	margin-top: 8px;
}

.actions {
	display: flex;
	align-items: center;
	gap: var(--v-sheet-padding);

	.v-pagination {
		:deep(.v-button) {
			display: inline-flex;
		}
	}

	.table.v-pagination {
		margin-top: var(--v-sheet-padding);
	}

	.spacer {
		flex-grow: 1;
	}

	.search {
		position: relative;
		z-index: 1;
	}

	.item-count {
		color: var(--foreground-subdued);
		white-space: nowrap;
	}

	&.half,
	&.half-right {
		flex-wrap: wrap;

		.search {
			width: 100%;
			order: -1;

			:deep(.search-input),
			:deep(.search-badge) {
				width: 100% !important;
			}
		}
	}

	&.list {
		margin-top: 8px;
	}
}

.deselect {
	--v-icon-color: var(--foreground-subdued);
	transition: color var(--fast) var(--transition);
	margin: 0 4px;

	&:hover {
		--v-icon-color: var(--danger);
	}
}
</style>
