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
					:type="totalItemCount > 4 ? 'block-list-item-dense' : 'block-list-item'"
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
					@update:model-value="sortItems($event)"
				>
					<template #item="{ element }">
						<v-list-item
							block
							:dense="totalItemCount > 4"
							:disabled="disabled"
							:class="{ deleted: element.$type === 'deleted' }"
						>
							<v-icon v-if="allowDrag" name="drag_handle" class="drag-handle" left @click.stop="() => {}" />
							<render-template :collection="collection" :item="element" :template="templateWithDefaults" />
							<div class="spacer" />

							<router-link
								v-if="enableLink"
								v-tooltip="t('navigate_to_item')"
								:to="getLinkForItem(element)"
								class="item-link"
								:class="{ disabled: element.$type === 'created' }"
								@click.stop
							>
								<v-icon name="launch" />
							</router-link>
							<v-icon
								v-if="!disabled"
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
				<v-button :disabled="disabled" @click="selectModalActive = true">
					{{ t('add_existing') }}
				</v-button>
				<div class="spacer" />
				<v-pagination v-if="pageCount > 1" v-model="page" :length="pageCount" :total-visible="5" />
			</div>
		</div>

		<drawer-collection
			v-if="!disabled"
			v-model:active="selectModalActive"
			:collection="collection"
			:filter="filter"
			multiple
			@input="select"
		/>
	</div>
</template>

<script setup lang="ts">
import { clamp } from 'lodash';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

interface Props {
	item: (string | number)[];
	collection: string;
	template: string;
	filter: Record<string, any>;
}
const props = withDefaults(defineProps<Props>(), {});
const emit = defineEmits(['input']);

const { t } = useI18n();

const loading = ref(false);
const disabled = ref(false);
const selectModalActive = ref(false);
const pageCount = ref(1);
const page = ref(1);
const limit = ref(10);
const displayItems = ref([]);
const totalItemCount = computed(() => displayItems.value.length);
const allowDrag = ref(true);
const enableLink = ref(false);
const templateWithDefaults = ref('{{ id }}');

function select() {
	// console.log('selected');
}
function deleteItem(elem: any) {
	// console.log('deleteItem', elem);
}
function getDeselectIcon(elem: any) {
	// console.log('getDeselectIcon', elem);
}
function getLinkForItem(elem: any) {
	return '/test';
}
function sortItems(elem: any) {
	// console.log('sortItems', elem);
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
