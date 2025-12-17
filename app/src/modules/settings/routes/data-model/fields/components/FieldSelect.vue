<script setup lang="ts">
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import { useExtension } from '@/composables/use-extension';
import InterfaceSystemCollection from '@/interfaces/_system/system-collection/system-collection.vue';
import { useFieldsStore } from '@/stores/fields';
import { getLocalTypeForField } from '@/utils/get-local-type';
import { getRelatedCollection } from '@/utils/get-related-collection';
import { getSpecialForType } from '@/utils/get-special-for-type';
import { hideDragImage } from '@/utils/hide-drag-image';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';
import type { Field, Width } from '@directus/types';
import { cloneDeep } from 'lodash';
import { computed, ref, unref } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRouter } from 'vue-router';
import Draggable from 'vuedraggable';
import FieldSelectMenu from './field-select-menu.vue';

const props = withDefaults(
	defineProps<{
		field: Field;
		disabled?: boolean;
		fields?: Field[];
	}>(),
	{
		fields: () => [],
	},
);

const emit = defineEmits(['setNestedSort']);

const { t } = useI18n();

const router = useRouter();

const fieldsStore = useFieldsStore();

const { deleteActive, deleting, deleteField } = useDeleteField();
const { duplicateActive, duplicateName, duplicateTo, saveDuplicate, duplicating } = useDuplicate();

const inter = useExtension(
	'interface',
	computed(() => props.field.meta?.interface ?? null),
);

const interfaceName = computed(() => inter.value?.name ?? null);

const hidden = computed(() => props.field.meta?.hidden === true);

const localType = computed(() => getLocalTypeForField(props.field.collection, props.field.field));

const nestedFields = computed(() => props.fields.filter((field) => field.meta?.group === props.field.field));

const relatedCollectionInfo = computed(() => getRelatedCollection(props.field.collection, props.field.field));

const showRelatedCollectionLink = computed(
	() =>
		unref(relatedCollectionInfo) !== null &&
		props.field.collection !== unref(relatedCollectionInfo)?.relatedCollection &&
		['translations', 'm2o', 'm2m', 'o2m', 'files'].includes(unref(localType) as string),
);

async function setWidth(width: Width) {
	try {
		await fieldsStore.updateField(props.field.collection, props.field.field, { meta: { width } });
	} catch (error) {
		unexpectedError(error);
	}
}

async function toggleVisibility() {
	try {
		await fieldsStore.updateField(props.field.collection, props.field.field, {
			meta: { hidden: !props.field.meta?.hidden },
		});
	} catch (error) {
		unexpectedError(error);
	}
}

function useDeleteField() {
	const deleteActive = ref(false);
	const deleting = ref(false);

	return {
		deleteActive,
		deleting,
		deleteField,
	};

	async function deleteField() {
		if (deleting.value) return;

		deleting.value = true;
		await fieldsStore.deleteField(props.field.collection, props.field.field);
		deleting.value = false;
		deleteActive.value = false;
	}
}

function useDuplicate() {
	const duplicateActive = ref(false);
	const duplicateName = ref(props.field.field + '_copy');
	const duplicating = ref(false);

	const duplicateTo = ref(props.field.collection);

	return {
		duplicateActive,
		duplicateName,
		duplicateTo,
		saveDuplicate,
		duplicating,
	};

	async function saveDuplicate() {
		if (duplicateName.value === null || duplicating.value) return;

		const newField: Record<string, any> = {
			...cloneDeep(props.field),
			field: duplicateName.value,
			collection: duplicateTo.value,
		};

		if (newField.meta) {
			delete newField.meta.id;
			delete newField.meta.sort;
			delete newField.meta.group;
		}

		if (newField.schema) {
			delete newField.schema.comment;
		}

		delete newField.name;

		duplicating.value = true;

		try {
			await fieldsStore.createField(duplicateTo.value, newField);

			notify({
				title: t('field_create_success', { field: newField.field }),
			});

			duplicateActive.value = false;
		} catch (error) {
			unexpectedError(error);
		} finally {
			duplicating.value = false;
		}
	}
}

async function openFieldDetail() {
	if (!props.field.meta) {
		const special = getSpecialForType(props.field.type);

		try {
			await fieldsStore.updateField(props.field.collection, props.field.field, { meta: { special } });
		} catch (error) {
			unexpectedError(error);
		}
	}

	router.push(`/settings/data-model/${props.field.collection}/${props.field.field}`);
}

async function onGroupSortChange(fields: Field[]) {
	const updates = fields.map((field, index) => ({
		field: field.field,
		meta: {
			sort: index + 1,
			group: props.field.meta!.field,
		},
	}));

	emit('setNestedSort', updates);
}

const tFieldType = (type: string) => t(type === 'geometry' ? 'geometry.All' : type);
</script>

<template>
	<div class="field-select" :class="field.meta?.width || 'full'">
		<VInput v-if="disabled" disabled class="field">
			<template #prepend>
				<VIcon v-tooltip="$t('system_fields_locked')" name="lock" />
			</template>

			<template #input>
				<div
					v-tooltip="`${field.name} (${tFieldType(field.type)})${interfaceName ? ` - ${interfaceName}` : ''}`"
					class="label"
				>
					<div class="label-inner">
						<span class="name">{{ field.field }}</span>
						<span v-if="interfaceName" class="interface">{{ interfaceName }}</span>
					</div>
				</div>
			</template>
		</VInput>

		<template v-else>
			<Draggable
				v-if="localType === 'group'"
				class="field-grid group full nested"
				:model-value="nestedFields"
				handle=".drag-handle"
				:group="{ name: 'fields' }"
				:set-data="hideDragImage"
				:animation="150"
				item-key="field"
				v-bind="{ 'force-fallback': true, 'fallback-on-body': true, 'invert-swap': true }"
				@update:model-value="onGroupSortChange"
			>
				<template #header>
					<div class="header full">
						<VIcon class="drag-handle" name="drag_indicator" @click.stop />
						<span class="name">
							{{ field.field }}
							<VIcon v-if="field.meta?.required === true" name="star" class="required" sup filled />
						</span>
						<VIcon v-if="hidden" v-tooltip="$t('hidden_field')" name="visibility_off" class="hidden-icon" small />
						<FieldSelectMenu
							:field="field"
							:no-delete="nestedFields.length > 0"
							@toggle-visibility="toggleVisibility"
							@set-width="setWidth($event)"
							@duplicate="duplicateActive = true"
							@delete="deleteActive = true"
						/>
					</div>
				</template>

				<template #item="{ element }">
					<FieldSelect :field="element" :fields="fields" @set-nested-sort="$emit('setNestedSort', $event)" />
				</template>
			</Draggable>

			<VInput v-else class="field" :class="{ hidden }" readonly>
				<template #prepend>
					<VIcon class="drag-handle" name="drag_indicator" @click.stop />
				</template>

				<template #input>
					<div
						v-tooltip="`${field.name} (${tFieldType(field.type)})${interfaceName ? ` - ${interfaceName}` : ''}`"
						class="label"
						@click="openFieldDetail"
					>
						<div class="label-inner">
							<span class="name">
								{{ field.field }}
								<VIcon v-if="field.meta?.required === true" name="star" class="required" sup filled />
							</span>
							<span v-if="field.meta" class="interface">{{ interfaceName }}</span>
							<span v-else class="interface">{{ $t('db_only_click_to_configure') }}</span>
						</div>
					</div>
				</template>

				<template #append>
					<div class="icons">
						<VIcon
							v-if="field.schema && field.schema.is_primary_key"
							v-tooltip="$t('primary_key')"
							name="vpn_key"
							small
						/>
						<VIcon
							v-if="!field.meta"
							v-tooltip="$t('db_only_click_to_configure')"
							name="report_problem"
							class="unmanaged"
							small
						/>
						<VIcon v-if="hidden" v-tooltip="$t('hidden_field')" name="visibility_off" class="hidden-icon" small />

						<RouterLink
							v-if="showRelatedCollectionLink"
							:to="`/settings/data-model/${relatedCollectionInfo!.relatedCollection}`"
						>
							<VIcon name="open_in_new" class="link-icon" small />
						</RouterLink>

						<FieldSelectMenu
							:field="field"
							@toggle-visibility="toggleVisibility"
							@set-width="setWidth($event)"
							@duplicate="duplicateActive = true"
							@delete="deleteActive = true"
						/>
					</div>
				</template>
			</VInput>

			<VDialog v-model="duplicateActive" @esc="duplicateActive = false" @apply="saveDuplicate">
				<VCard class="duplicate">
					<VCardTitle>{{ $t('duplicate_where_to') }}</VCardTitle>
					<VCardText>
						<div class="form-grid">
							<div class="field">
								<span class="type-label">{{ $t('collection', 0) }}</span>
								<InterfaceSystemCollection :value="duplicateTo" class="monospace" @input="duplicateTo = $event" />
							</div>

							<div class="field">
								<span class="type-label">{{ $t('field', 0) }}</span>
								<VInput v-model="duplicateName" class="monospace" db-safe autofocus />
							</div>
						</div>
					</VCardText>
					<VCardActions>
						<VButton secondary @click="duplicateActive = false">
							{{ $t('cancel') }}
						</VButton>
						<VButton :disabled="duplicateName === null" :loading="duplicating" @click="saveDuplicate">
							{{ $t('duplicate') }}
						</VButton>
					</VCardActions>
				</VCard>
			</VDialog>

			<VDialog v-model="deleteActive" @esc="deleteActive = false" @apply="deleteField">
				<VCard>
					<VCardTitle>{{ $t('delete_field_are_you_sure', { field: field.field }) }}</VCardTitle>
					<VCardActions>
						<VButton secondary @click="deleteActive = false">{{ $t('cancel') }}</VButton>
						<VButton :loading="deleting" kind="danger" @click="deleteField">{{ $t('delete_label') }}</VButton>
					</VCardActions>
				</VCard>
			</VDialog>
		</template>
	</div>
</template>

<style lang="scss" scoped>
.field-select {
	--input-height: 40px;
	--theme--form--field--input--padding: 8px;
}

.full,
.fill {
	grid-column: 1 / span 2;
}

.v-input.monospace {
	--v-input-font-family: var(--theme--fonts--monospace--font-family);
}

.v-select.monospace {
	--v-select-font-family: var(--theme--fonts--monospace--font-family);
}

.v-icon {
	--v-icon-color: var(--theme--foreground-subdued);
	--v-icon-color-hover: var(--foreground);

	&.hidden-icon {
		--v-icon-color-hover: var(--theme--foreground-subdued);
	}

	&.unmanaged {
		--v-icon-color: var(--theme--warning);
		--v-icon-color-hover: var(--theme--warning);
	}

	&.link-icon:hover {
		--v-icon-color: var(--theme--foreground);
	}
}

.drag-handle {
	cursor: grab !important;
}

.duplicate {
	.type-label {
		margin-block-end: 4px;
	}

	.duplicate-field + .duplicate-field {
		margin-block-end: 32px;
	}
}

.group {
	position: relative;
	min-block-size: var(--theme--form--field--input--height);
	padding: var(--theme--form--field--input--padding);
	padding-block: 40px 16px;
	border-radius: var(--theme--border-radius);

	> * {
		position: relative;
		z-index: 2;
	}

	&::before {
		position: absolute;
		inset-block-start: 0;
		inset-inline-start: -2px;
		z-index: 1;
		inline-size: 4px;
		block-size: 100%;
		background-color: var(--theme--primary);
		border-radius: 2px;
		content: '';
	}

	&::after {
		position: absolute;
		inset-block-start: 0;
		inset-inline-start: 0;
		z-index: 1;
		inline-size: 100%;
		block-size: 100%;
		background-color: var(--theme--primary);
		opacity: 0.1;
		content: '';
	}

	.header {
		position: absolute;
		inset-block-start: 0;
		inset-inline-start: 0;
		display: flex;
		align-items: center;
		inline-size: 100%;
		margin-block-end: 8px;
		padding-block-start: 8px;
		color: var(--theme--primary);
		font-family: var(--theme--fonts--monospace--font-family);

		.drag-handle {
			--v-icon-color: var(--theme--primary);

			margin-inline-end: 8px;
		}

		.name {
			flex-grow: 1;
		}
	}
}

.field-grid {
	position: relative;
	display: grid;
	gap: 8px;
	grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);

	& + & {
		margin-block-start: 8px;
	}

	&.nested {
		.field :deep(.input) {
			border: var(--theme--border-width) solid var(--theme--primary-subdued);
		}
	}
}

.field {
	&.v-input :deep(.input) {
		border: var(--theme--border-width) solid var(--theme--border-color-subdued);
	}

	&.v-input :deep(.input:hover) {
		border: var(--theme--border-width) solid var(--theme--form--field--input--border-color-hover);
	}

	.label {
		display: flex;
		flex-grow: 1;
		align-items: center;
		align-self: stretch;
		overflow: hidden;
		cursor: pointer;

		.label-inner {
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;

			.name {
				margin-inline-end: 8px;
				font-family: var(--theme--fonts--monospace--font-family);
			}

			.interface {
				display: none;
				color: var(--theme--foreground-subdued);
				font-family: var(--theme--fonts--monospace--font-family);
				opacity: 0;
				transition: opacity var(--fast) var(--transition);

				@media (width > 640px) {
					display: initial;
				}
			}
		}
	}

	&:hover {
		.label {
			.interface {
				opacity: 1;
			}
		}
	}
}

.icons {
	* + *:not(:last-child) {
		margin-inline-start: 8px;
	}
}

.spacer {
	flex-grow: 1;
}

.form-grid {
	--theme--form--row-gap: 24px;
}

.required {
	position: relative;
	inset-inline-start: -8px;
	color: var(--theme--primary);
}

.sortable-ghost {
	border-radius: var(--theme--border-radius);
	outline: 2px dashed var(--theme--primary);

	> * {
		opacity: 0;
	}
}
</style>
