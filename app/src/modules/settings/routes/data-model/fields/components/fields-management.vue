<script setup lang="ts">
import { useFieldsStore } from '@/stores/fields';
import { hideDragImage } from '@/utils/hide-drag-image';
import { Field, LocalType } from '@directus/types';
import { isNil, orderBy } from 'lodash';
import { computed, toRefs, onBeforeMount, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import Draggable from 'vuedraggable';
import FieldSelect from './field-select.vue';

const props = defineProps<{
	collection: string;
}>();

const { t } = useI18n();

const { collection } = toRefs(props);
const fieldsStore = useFieldsStore();
onBeforeMount(async () => await fieldsStore.hydrate({ skipTranslation: true }));
onBeforeUnmount(() => fieldsStore.translateFields());

const fields = computed(() => fieldsStore.getFieldsForCollectionSorted(collection.value));

const parsedFields = computed(() => {
	return orderBy(fields.value, [(o) => (o.meta?.sort ? Number(o.meta?.sort) : null), (o) => o.meta?.id]).filter(
		(field) => field.field.startsWith('$') === false,
	);
});

const lockedFields = computed(() => {
	return parsedFields.value.filter((field) => field.meta?.system === true);
});

const usableFields = computed(() => {
	return parsedFields.value.filter((field) => field.meta?.system !== true);
});

const addOptions = computed<Array<{ type: LocalType; icon: string; text: any } | { divider: boolean }>>(() => [
	{
		type: 'standard',
		icon: 'create',
		text: t('standard_field'),
	},
	{
		type: 'presentation',
		icon: 'scatter_plot',
		text: t('presentation_and_aliases'),
	},
	{
		type: 'group',
		icon: 'view_in_ar',
		text: t('field_group'),
	},
	{
		divider: true,
	},
	{
		type: 'file',
		icon: 'photo',
		text: t('single_file'),
	},
	{
		type: 'files',
		icon: 'collections',
		text: t('multiple_files'),
	},
	{
		divider: true,
	},
	{
		type: 'm2o',
		icon: 'call_merge',
		text: t('m2o_relationship'),
	},
	{
		type: 'o2m',
		icon: 'call_split',
		text: t('o2m_relationship'),
	},
	{
		type: 'm2m',
		icon: 'import_export',
		text: t('m2m_relationship'),
	},
	{
		type: 'm2a',
		icon: 'gesture',
		text: t('m2a_relationship'),
	},
	{
		divider: true,
	},
	{
		type: 'translations',
		icon: 'translate',
		text: t('translations'),
	},
]);

async function setSort(fields: Field[]) {
	const updates = fields.map((field, index) => ({
		field: field.field,
		meta: {
			sort: index + 1,
			group: null,
		},
	}));

	await fieldsStore.updateFields(collection.value, updates);
}

async function setNestedSort(updates?: Field[]) {
	updates = (updates || []).filter((val) => isNil(val) === false);

	if (updates.length > 0) {
		await fieldsStore.updateFields(collection.value, updates);
	}
}
</script>

<template>
	<div class="fields-management">
		<div v-if="lockedFields.length > 0" class="fields-grid">
			<field-select v-for="field in lockedFields" :key="field.field" disabled :field="field" />
		</div>

		<draggable
			class="fields-grid"
			:model-value="usableFields.filter((field) => isNil(field?.meta?.group))"
			handle=".drag-handle"
			:group="{ name: 'fields' }"
			:set-data="hideDragImage"
			item-key="field"
			:animation="150"
			v-bind="{ 'force-fallback': true, 'fallback-on-body': true, 'invert-swap': true }"
			@update:model-value="setSort"
		>
			<template #item="{ element }">
				<field-select :field="element" :fields="usableFields" @set-nested-sort="setNestedSort" />
			</template>
		</draggable>

		<v-button full-width :to="`/settings/data-model/${collection}/+`">
			{{ t('create_field') }}
		</v-button>

		<v-menu show-arrow>
			<template #activator="{ toggle, active }">
				<button class="add-field-advanced" :dashed="!active" :class="{ active }" @click="toggle">
					{{ t('create_in_advanced_field_creation_mode') }}
				</button>
			</template>
			<v-list>
				<template v-for="(option, index) in addOptions" :key="index">
					<v-divider v-if="option.divider === true" />
					<v-list-item v-else :to="`/settings/data-model/${collection}/+?type=${option.type}`">
						<v-list-item-icon>
							<v-icon :name="option.icon" />
						</v-list-item-icon>
						<v-list-item-content>
							{{ option.text }}
						</v-list-item-content>
					</v-list-item>
				</template>
			</v-list>
		</v-menu>
	</div>
</template>

<style lang="scss" scoped>
.v-divider {
	margin: 32px 0;
}

.fields-management {
	margin-bottom: 24px;
}

.fields-grid {
	position: relative;
	display: grid;
	grid-template-columns: repeat(12, 1fr);
	gap: var(--theme--form--row-gap) var(--theme--form--column-gap);
	margin-bottom: var(--theme--form--row-gap);
	width: 100%;

	.sixth {
		grid-column: span 2;

		@media (max-width: 959px) {
			grid-column: 1 / -1;
		}
	}

	.fifth {
		grid-column: span 2.4;

		@media (max-width: 959px) {
			grid-column: 1 / -1;
		}
	}

	.quarter {
		grid-column: span 3;

		@media (max-width: 959px) {
			grid-column: 1 / -1;
		}
	}

	.third {
		grid-column: span 4;

		@media (max-width: 959px) {
			grid-column: 1 / -1;
		}
	}

	.half,
	.half-left,
	.half-space {
		grid-column: span 6;

		@media (max-width: 959px) {
			grid-column: 1 / -1;
		}
	}

	.half + .half,
	.half-right {
		grid-column: span 6;

		@media (max-width: 959px) {
			grid-column: 1 / -1;
		}
	}

	.full {
		grid-column: 1 / -1;
	}

	.fill {
		grid-column: 1 / -1;
	}
}

.field-select {
	margin: 0;
}

.field-select:deep(.fields-nested-grid) {
	margin: var(--theme--form--row-gap) 0;
	width: 100%;
}

.add-field {
	--v-button-font-size: 14px;
	--v-button-background-color: var(--theme--primary);
	--v-button-background-color-hover: var(--theme--primary-accent);
}

.add-field-advanced {
	display: block;
	width: max-content;
	margin: 0 auto;
	margin-top: 8px;
	color: var(--theme--foreground-subdued);
	transition: color var(--fast) var(--transition);

	&:hover {
		color: var(--theme--foreground);
	}
}

.visible {
	margin-bottom: 24px;
}

.list-move {
	transition: transform 0.5s;
}
</style>
