<template>
	<v-notice v-if="!true" type="warning">
		{{ t('relationship_not_setup') }}
	</v-notice>
	<div v-else class="one-to-many">
		<div>
			<template v-if="loading">
				<v-skeleton-loader
					v-for="n in clamp(totalItemCount - (page - 1) * limit, 1, limit)"
					:key="n"
					type="block-list-item-dense"
				/>
			</template>

			<v-notice v-else-if="displayItems.length === 0">
				{{ t('no_items') }}
			</v-notice>

			<v-list v-else>
				<draggable
					:force-fallback="true"
					:model-value="displayItems"
					item-key="id"
					handle=".drag-handle"
					:disabled="!allowDrag"
				>
					<template #item="{ element }">
						<v-list-item block :dense="true">
							<!-- <v-icon v-if="allowDrag" name="drag_handle" class="drag-handle" left @click.stop="() => {}" /> -->
							<render-template :collection="collection" :item="element" :template="displayTemplate" />
							<div class="spacer" />
							<v-icon
								v-tooltip="t('some tooltip')"
								class="deselect"
								:name="getDeselectIcon(element)"
								@click.stop="deleteItem(element)"
							/>
						</v-list-item>
					</template>
				</draggable>
			</v-list>

			<div class="actions list">
				<v-button @click="$emit('select')">
					{{ t('add_existing') }}
				</v-button>
				<div class="spacer" />
				<v-pagination v-if="pageCount > 1" v-model="page" :length="pageCount" :total-visible="5" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { clamp } from 'lodash';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Draggable from 'vuedraggable';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';
import { getEndpoint, getFieldsFromTemplate } from '@directus/shared/utils';
import { useApi } from '@directus/shared/composables';

interface Props {
	value: (string | number)[];
	collection: string;
	template: string;
	filter: Record<string, any>;
	limit: number;
}
const props = withDefaults(defineProps<Props>(), {
	limit: 5,
});
const emit = defineEmits(['input', 'select']);

const collectionsStore = useCollectionsStore();
const fieldStore = useFieldsStore();

const { t } = useI18n();
const api = useApi();

const loading = ref(false);
const pageCount = ref(1);
const page = ref(1);
const limit = ref(10);
const displayItems = ref([]);
// watch(displayItems, () => console.log(displayItems.value));
const totalItemCount = computed(() => displayItems.value.length);
const allowDrag = ref(true);
const templateWithDefaults = ref('{{ id }}');
const displayTemplate = computed(() => {
	// if (props.template) return props.template;

	const pkField = fieldStore.getPrimaryKeyFieldForCollection(props.collection);

	return false /*props.template*/ || `{{ ${pkField?.field || 'id'} }}`;
});
const requiredFields = computed(() => {
	if (!displayTemplate.value || !props.collection) return [];
	return adjustFieldsForDisplays(getFieldsFromTemplate(displayTemplate.value), props.collection);
});
watch(() => props.value, getDisplayItems, { immediate: true });

function select() {
	// console.log('selected');
}
function deleteItem(elem: any) {
	// console.log('deleteItem', elem);
}
function getDeselectIcon(elem: any) {
	return 'delete';
	// console.log('getDeselectIcon', elem);
}
function getLinkForItem(elem: any) {
	return '/test';
}
function sortItems(elem: any) {
	// console.log('sortItems', elem);
}
async function getDisplayItems() {
	if (props.value.length === 0) {
		displayItems.value = [];
		return;
	}

	const pkField = fieldStore.getPrimaryKeyFieldForCollection(props.collection);
	const sortField = collectionsStore.getCollection(props.collection)?.meta?.sort_field;
	if (!props.collection || !pkField) return;

	const fields = new Set(requiredFields.value);
	fields.add(pkField.field);

	if (sortField) fields.add(sortField);

	try {
		loading.value = true;

		const response = await api.get(getEndpoint(props.collection), {
			params: {
				fields: Array.from(fields),
				filter: { [pkField.field]: { _in: props.value } },
			},
		});

		displayItems.value = response.data.data;
	} catch (err: any) {
		// console.error(err);
	} finally {
		loading.value = false;
	}
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

.item-link {
	--v-icon-color: var(--foreground-subdued);
	transition: color var(--fast) var(--transition);
	margin: 0 4px;

	&:hover {
		--v-icon-color: var(--primary);
	}

	&.disabled {
		opacity: 0;
		pointer-events: none;
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

.per-page {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	width: 120px;
	padding: 10px 0;
	margin-right: 2px;
	color: var(--foreground-subdued);

	span {
		width: auto;
		margin-right: 8px;
	}

	.v-select {
		color: var(--foreground-normal);
	}
}
</style>
