<script setup lang="ts">
import type { ContentVersion, Filter } from '@directus/types';
import { deepMap, getFieldsFromTemplate } from '@directus/utils';
import { clamp, get, isEmpty, isNil, set } from 'lodash';
import { render } from 'micromustache';
import { computed, inject, ref, toRefs } from 'vue';
import Draggable from 'vuedraggable';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import VNotice from '@/components/v-notice.vue';
import VPagination from '@/components/v-pagination.vue';
import VRemove from '@/components/v-remove.vue';
import VSkeletonLoader from '@/components/v-skeleton-loader.vue';
import VUpload from '@/components/v-upload.vue';
import { useMimeTypeFilter } from '@/composables/use-mime-type-filter';
import { useRelationM2M } from '@/composables/use-relation-m2m';
import { DisplayItem, RelationQueryMultiple, useRelationMultiple } from '@/composables/use-relation-multiple';
import { useRelationPermissionsM2M } from '@/composables/use-relation-permissions';
import { useServerStore } from '@/stores/server';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';
import { getAssetUrl } from '@/utils/get-asset-url';
import { parseFilter } from '@/utils/parse-filter';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import DrawerFiles from '@/views/private/components/drawer-files.vue';
import DrawerItem from '@/views/private/components/drawer-item.vue';
import RenderTemplate from '@/views/private/components/render-template.vue';

const props = withDefaults(
	defineProps<{
		value: (number | string | Record<string, any>)[] | Record<string, any> | null;
		primaryKey: string | number;
		collection: string;
		field: string;
		disabled?: boolean;
		nonEditable?: boolean;
		version: ContentVersion | null;
		template?: string | null;
		enableCreate?: boolean;
		enableSelect?: boolean;
		folder?: string;
		filter?: Filter;
		showNavigation?: boolean;
		limit?: number;
		allowedMimeTypes?: string[];
	}>(),
	{
		nonEditable: false,
		template: null,
		enableCreate: true,
		enableSelect: true,
		limit: 15,
	},
);

const emit = defineEmits<{
	input: [value: (number | string | Record<string, any>)[] | Record<string, any> | null];
}>();

const { collection, field, primaryKey, limit, version } = toRefs(props);
const { relationInfo } = useRelationM2M(collection, field);

const value = computed({
	get: () => props.value,
	set: (val) => {
		emit('input', val);
	},
});

const { info } = useServerStore();

const globalMimeTypeAllowList = computed(() => {
	const allowList = info.files?.mimeTypeAllowList;

	if (!allowList || allowList === '*/*') {
		return undefined;
	}

	if (Array.isArray(allowList)) {
		return allowList as string[];
	}

	return (allowList as string).split(',').map((type: string) => type.trim());
});

const { mimeTypeFilter, combinedAcceptString } = useMimeTypeFilter(
	computed(() => props.allowedMimeTypes),
	globalMimeTypeAllowList,
);

const templateWithDefaults = computed(() => {
	if (!relationInfo.value) return null;

	if (props.template) return props.template;

	if (relationInfo.value.junctionCollection.meta?.display_template) {
		return relationInfo.value.junctionCollection.meta?.display_template;
	}

	let relatedDisplayTemplate = relationInfo.value.relatedCollection.meta?.display_template;

	if (relatedDisplayTemplate) {
		const regex = /({{.*?}})/g;
		const parts = relatedDisplayTemplate.split(regex).filter((p) => p);

		for (const part of parts) {
			if (part.startsWith('{{') === false) continue;
			const key = part.replace(/{{/g, '').replace(/}}/g, '').trim();
			const newPart = `{{${relationInfo.value.relation.field}.${key}}}`;

			relatedDisplayTemplate = relatedDisplayTemplate.replace(part, newPart);
		}

		return relatedDisplayTemplate;
	}

	return `{{${relationInfo.value.relation.field}.${relationInfo.value.relatedPrimaryKeyField.field}}}`;
});

const fields = computed(() =>
	adjustFieldsForDisplays(
		[...getFieldsFromTemplate(templateWithDefaults.value), `${relationInfo.value?.relation.field}.filename_download`],
		relationInfo.value?.junctionCollection.collection ?? '',
	),
);

const page = ref(1);

const query = computed<RelationQueryMultiple>(() => ({
	fields: fields.value,
	limit: limit.value,
	page: page.value,
}));

const {
	update,
	remove,
	select,
	displayItems,
	totalItemCount,
	loading,
	selected,
	isItemSelected,
	isLocalItem,
	getItemEdits,
} = useRelationMultiple(value, query, relationInfo, primaryKey, version);

const { createAllowed, updateAllowed, selectAllowed, deleteAllowed } = useRelationPermissionsM2M(relationInfo);

const pageCount = computed(() => Math.ceil(totalItemCount.value / limit.value));

function sortItems(items: DisplayItem[]) {
	const info = relationInfo.value;
	const sortField = info?.sortField;
	if (!info || !sortField) return;

	const sortedItems = items.map((item, index) => {
		const junctionId = item?.[info.junctionPrimaryKeyField.field];
		const relatedId = item?.[info.junctionField.field]?.[info.relatedPrimaryKeyField.field];

		const changes: Record<string, any> = {
			$index: item.$index,
			$type: item.$type,
			$edits: item.$edits,
			...getItemEdits(item),
			[sortField]: index + 1,
		};

		if (!isNil(junctionId)) {
			changes[info.junctionPrimaryKeyField.field] = junctionId;
		}

		if (!isNil(relatedId)) {
			set(changes, info.junctionField.field + '.' + info.relatedPrimaryKeyField.field, relatedId);
		}

		return changes;
	});

	update(...sortedItems);
}

const selectedPrimaryKeys = computed(() => {
	if (!relationInfo.value) return [];
	const junctionField = relationInfo.value.junctionField.field;
	const relationPkField = relationInfo.value.relatedPrimaryKeyField.field;

	return selected.value.map((item) => item[junctionField][relationPkField]);
});

const editModalActive = ref(false);
const currentlyEditing = ref<string | number | null>(null);
const relatedPrimaryKey = ref<string | number | null>(null);
const selectModalActive = ref(false);
const editsAtStart = ref<Record<string, any>>({});

function editItem(item: DisplayItem) {
	if (!relationInfo.value) return;

	const relationPkField = relationInfo.value.relatedPrimaryKeyField.field;
	const junctionField = relationInfo.value.junctionField.field;
	const junctionPkField = relationInfo.value.junctionPrimaryKeyField.field;

	editsAtStart.value = getItemEdits(item);

	editModalActive.value = true;

	if (item?.$type === 'created' && !isItemSelected(item)) {
		currentlyEditing.value = null;
		relatedPrimaryKey.value = null;
	} else {
		currentlyEditing.value = get(item, [junctionPkField], null);
		relatedPrimaryKey.value = get(item, [junctionField, relationPkField], null);
	}
}

function stageEdits(item: Record<string, any>) {
	if (isEmpty(item)) return;

	update(item);
}

function deleteItem(item: DisplayItem) {
	if (
		page.value === Math.ceil(totalItemCount.value / limit.value) &&
		page.value !== Math.ceil((totalItemCount.value - 1) / limit.value)
	) {
		page.value = Math.max(1, page.value - 1);
	}

	remove(item);
}

const showUpload = ref(false);

function onUpload(files: Record<string, any>[] | null) {
	showUpload.value = false;
	if (!files || files.length === 0 || !relationInfo.value) return;

	const fileIds = files.map((file) => file.id);

	select(fileIds);
}

function onSelect(selected: (string | number)[] | null) {
	select(selected!.filter((id) => selectedPrimaryKeys.value.includes(id) === false));
}

const downloadName = computed(() => {
	if (relatedPrimaryKey.value === null || relationInfo.value?.relatedCollection.collection !== 'directus_files') return;
	const junctionField = relationInfo.value.junctionField.field;
	const relationPkField = relationInfo.value.relatedPrimaryKeyField.field;

	return displayItems.value.find((item) => get(item, [junctionField, relationPkField]) === relatedPrimaryKey.value)?.[
		junctionField
	]?.filename_download;
});

const downloadUrl = computed(() => {
	if (relatedPrimaryKey.value === null || relationInfo.value?.relatedCollection.collection !== 'directus_files') return;
	return getAssetUrl(String(relatedPrimaryKey.value), { isDownload: true });
});

function getFilename(junctionRow: Record<string, any>) {
	const junctionField = relationInfo.value?.junctionField.field;
	if (!junctionField) return;

	const key = junctionRow[junctionField]?.id ?? junctionRow[junctionField] ?? null;
	if (!key) return null;

	return key;
}

function getDownloadName(junctionRow: Record<string, any>) {
	const junctionField = relationInfo.value?.junctionField.field;
	if (!junctionField) return;

	return junctionRow[junctionField]?.filename_download;
}

const values = inject('values', ref<Record<string, unknown>>({}));

const customFilter = computed(() => {
	if (!relationInfo.value) return;

	const filter: Filter = {
		_and: [],
	};

	const reverseRelation = `$FOLLOW(${relationInfo.value.junctionCollection.collection},${relationInfo.value.junctionField.field})`;

	const selectFilter: Filter = {
		[reverseRelation]: {
			_none: {
				[relationInfo.value.reverseJunctionField.field]: {
					_eq: props.primaryKey,
				},
			},
		},
	};

	if (selectedPrimaryKeys.value.length > 0) {
		filter._and.push({
			[relationInfo.value.relatedPrimaryKeyField.field]: {
				_nin: selectedPrimaryKeys.value,
			},
		});
	}

	if (props.primaryKey !== '+') filter._and.push(selectFilter);

	if (props.filter) {
		filter._and.push(
			parseFilter(
				deepMap(props.filter, (val: unknown) => {
					if (val && typeof val === 'string') {
						return render(val, values.value);
					}

					return val;
				}),
			),
		);
	}

	if (mimeTypeFilter.value) {
		filter._and.push(mimeTypeFilter.value);
	}

	return filter;
});

const allowDrag = computed(
	() =>
		totalItemCount.value <= limit.value &&
		relationInfo.value?.sortField !== undefined &&
		!props.disabled &&
		updateAllowed.value,
);

const menuActive = computed(() => editModalActive.value || selectModalActive.value || showUpload.value);
</script>

<template>
	<VNotice v-if="!relationInfo" type="warning">{{ $t('relationship_not_setup') }}</VNotice>
	<div v-else v-prevent-focusout="menuActive" class="many-to-many">
		<template v-if="loading">
			<VSkeletonLoader
				v-for="n in clamp(totalItemCount - (page - 1) * limit, 1, limit)"
				:key="n"
				:type="totalItemCount > 4 ? 'block-list-item-dense' : 'block-list-item'"
			/>
		</template>

		<template v-else>
			<VNotice v-if="displayItems.length === 0">{{ $t('no_items') }}</VNotice>

			<Draggable
				v-else
				:model-value="displayItems"
				tag="v-list"
				item-key="id"
				handle=".drag-handle"
				:disabled="!allowDrag"
				v-bind="{ 'force-fallback': true }"
				@update:model-value="sortItems($event)"
			>
				<template #item="{ element }">
					<VListItem
						:class="{ deleted: element.$type === 'deleted' }"
						:dense="totalItemCount > 4"
						:disabled="disabled && !nonEditable"
						block
						clickable
						@click="editItem(element)"
					>
						<VIcon v-if="allowDrag" name="drag_handle" class="drag-handle" left @click.stop="() => {}" />

						<RenderTemplate
							:collection="relationInfo.junctionCollection.collection"
							:item="element"
							:template="templateWithDefaults"
						/>

						<div class="spacer" />

						<div v-if="!nonEditable" class="item-actions">
							<VRemove
								v-if="deleteAllowed || isLocalItem(element)"
								:disabled
								:item-type="element.$type"
								:item-info="relationInfo"
								:item-is-local="isLocalItem(element)"
								:item-edits="getItemEdits(element)"
								@action="deleteItem(element)"
							/>

							<VMenu show-arrow placement="bottom-end" :disabled>
								<template #activator="{ toggle, active }">
									<VIcon name="more_vert" clickable class="menu" :class="{ active }" :disabled @click.stop="toggle" />
								</template>

								<VList>
									<VListItem clickable :href="getAssetUrl(getFilename(element))">
										<VListItemIcon><VIcon name="launch" /></VListItemIcon>
										<VListItemContent>{{ $t('open_file_in_tab') }}</VListItemContent>
									</VListItem>
									<VListItem
										clickable
										:download="getDownloadName(element)"
										:href="getAssetUrl(getFilename(element), { isDownload: true })"
									>
										<VListItemIcon><VIcon name="download" /></VListItemIcon>
										<VListItemContent>{{ $t('download_file') }}</VListItemContent>
									</VListItem>
								</VList>
							</VMenu>
						</div>
					</VListItem>
				</template>
			</Draggable>
		</template>

		<div v-if="!nonEditable || pageCount > 1" class="actions">
			<template v-if="!nonEditable">
				<VButton v-if="enableCreate && createAllowed" :disabled="disabled" @click="showUpload = true">
					{{ $t('upload_file') }}
				</VButton>

				<VButton v-if="enableSelect && selectAllowed" :disabled="disabled" @click="selectModalActive = true">
					{{ $t('add_existing') }}
				</VButton>
			</template>

			<div class="spacer" />

			<VPagination v-if="pageCount > 1" v-model="page" :length="pageCount" :total-visible="2" show-first-last />
		</div>

		<DrawerItem
			v-model:active="editModalActive"
			:disabled="disabled"
			:non-editable="nonEditable"
			:collection="relationInfo.junctionCollection.collection"
			:primary-key="currentlyEditing || '+'"
			:related-primary-key="relatedPrimaryKey || '+'"
			:junction-field="relationInfo.junctionField.field"
			:edits="editsAtStart"
			:circular-field="relationInfo.reverseJunctionField.field"
			@input="stageEdits"
		>
			<template #actions>
				<PrivateViewHeaderBarActionButton
					v-if="currentlyEditing !== '+' && relationInfo.relatedCollection.collection === 'directus_files'"
					icon="download"
					secondary
					:download="downloadName"
					:href="downloadUrl"
				/>
			</template>
		</DrawerItem>

		<DrawerFiles
			v-if="!disabled"
			v-model:active="selectModalActive"
			:collection="relationInfo.relatedCollection.collection"
			:folder="folder"
			:filter="customFilter"
			multiple
			@input="onSelect"
		/>

		<VDialog v-if="!disabled" v-model="showUpload">
			<VCard>
				<VCardTitle>{{ $t('upload_file') }}</VCardTitle>
				<VCardText>
					<VUpload multiple from-url :folder="folder" :accept="combinedAcceptString" @input="onUpload" />
				</VCardText>
				<VCardActions>
					<VButton @click="showUpload = false">{{ $t('done') }}</VButton>
				</VCardActions>
			</VCard>
		</VDialog>
	</div>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.v-list {
	@include mixins.list-interface($deleteable: true);
}

.v-list-item.disabled:not(.non-editable) {
	--v-list-item-background-color: var(--theme--form--field--input--background-subdued);
}

.item-actions {
	@include mixins.list-interface-item-actions;
}

.actions {
	@include mixins.list-interface-actions($pagination: true);
}

.menu {
	--v-icon-color-hover: var(--theme--form--field--input--foreground);

	&.active {
		--v-icon-color: var(--theme--form--field--input--foreground);
	}
}
</style>
