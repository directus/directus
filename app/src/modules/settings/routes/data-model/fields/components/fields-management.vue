<template>
	<div class="fields-management">
		<div class="field-grid">
			<field-select disabled v-for="field in lockedFields" :key="field.field" :field="field" />
		</div>

		<draggable
			class="field-grid"
			:model-value="usableFields"
			:force-fallback="true"
			handle=".drag-handle"
			group="fields"
			:set-data="hideDragImage"
			@update:model-value="setSort"
			item-key="field"
			@start="startDragging"
			@end="stopDragging"
		>
			<template #item="{ element }">
				<field-select :field="element" :draggingRow="draggingRow" />
			</template>
		</draggable>

		<v-menu attached>
			<template #activator="{ toggle, active }">
				<v-button
					@click="toggle"
					class="add-field"
					align="left"
					:dashed="!active"
					:class="{ active }"
					outlined
					large
					full-width
				>
					<v-icon name="add" />
					{{ t('create_field') }}
				</v-button>
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

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed, toRefs, onBeforeUnmount, ref } from 'vue';
import useCollection from '@/composables/use-collection/';
import Draggable from 'vuedraggable';
import { Field } from '@/types';
import { useFieldsStore } from '@/stores/';
import FieldSelect from './field-select.vue';
import hideDragImage from '@/utils/hide-drag-image';
import { orderBy } from 'lodash';

export default defineComponent({
	components: { Draggable, FieldSelect },
	props: {
		collection: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const { t } = useI18n();

		const { collection } = toRefs(props);
		const { fields } = useCollection(collection);
		const fieldsStore = useFieldsStore();

		const parsedFields = computed(() => {
			return orderBy(fields.value, [(o) => (o.meta?.sort ? Number(o.meta?.sort) : null), (o) => o.meta?.id]).filter(
				(field) => field.field.startsWith('$') === false
			);
		});

		const lockedFields = computed(() => {
			return parsedFields.value.filter((field) => field.meta?.system === true);
		});

		const usableFields = computed(() => {
			return parsedFields.value.filter((field) => field.meta?.system !== true);
		});

		const addOptions = computed(() => [
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

		const draggingRow = ref(false);
		const stopDragTimeout = ref();

		onBeforeUnmount(() => {
			clearTimeout(stopDragTimeout.value);
		});

		return {
			t,
			usableFields,
			lockedFields,
			setSort,
			hideDragImage,
			addOptions,
			startDragging,
			stopDragging,
			draggingRow,
		};

		async function setSort(fields: Field[]) {
			const updates = fields.map((field, index) => ({
				field: field.field,
				meta: {
					sort: index + 1,
				},
			}));

			await fieldsStore.updateFields(collection.value, updates);
		}

		function stopDraggingAfterDelay() {
			draggingRow.value = false;
		}

		function startDragging() {
			draggingRow.value = true;
		}

		function stopDragging() {
			stopDragTimeout.value = setTimeout(stopDraggingAfterDelay);
		}
	},
});
</script>

<style lang="scss" scoped>
.v-divider {
	margin: 32px 0;
}

.fields-management {
	margin-bottom: 24px;
}

.field-grid {
	position: relative;
	display: grid;
	grid-gap: 12px;
	grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);

	& + & {
		margin-top: 12px;
	}
}

.add-field {
	--v-button-font-size: 14px;
	--v-button-background-color: var(--primary);
	--v-button-background-color-hover: var(--primary-125);

	margin-top: 12px;

	.v-icon {
		margin-right: 8px;
	}

	&.active {
		--v-button-background-color: var(--primary);
	}
}

.visible {
	margin-bottom: 24px;
}

.list-move {
	transition: transform 0.5s;
}
</style>
