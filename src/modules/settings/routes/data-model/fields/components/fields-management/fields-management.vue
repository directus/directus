<template>
	<div class="fields-management">
		<draggable
			class="field-grid"
			:value="sortedVisibleFields"
			handle=".drag-handle"
			group="fields"
			@change="($event) => handleChange($event, 'visible')"
		>
			<template #header>
				<div class="group-name">Visible Fields</div>
			</template>

			<field-select
				v-for="field in sortedVisibleFields"
				:key="field.field"
				:field="field"
				@toggle-visibility="toggleVisibility($event, 'visible')"
				@edit="openFieldSetup(field)"
			/>

			<template #footer>
				<v-button class="add-field" align="left" dashed outlined @click="openFieldSetup()">
					<v-icon small name="add" />

					{{ $t('add_field') }}
				</v-button>
			</template>
		</draggable>

		<draggable
			class="field-grid hidden"
			:value="sortedHiddenFields"
			handle=".drag-handle"
			group="fields"
			@change="($event) => handleChange($event, 'hidden')"
		>
			<template #header>
				<div class="group-name">Hidden Fields</div>
			</template>

			<field-select
				v-for="field in sortedHiddenFields"
				:key="field.field"
				:field="field"
				@toggle-visibility="toggleVisibility($event, 'hidden')"
				@edit="openFieldSetup(field)"
			/>

			<template #footer>
				<v-button class="add-field" align="left" dashed outlined @click="openFieldSetup()">
					<v-icon small name="add" />

					{{ $t('add_field') }}
				</v-button>
			</template>
		</draggable>

		<field-setup
			:collection="collection"
			:active="fieldSetupActive"
			:existing-field="editingField"
			@toggle="closeFieldSetup"
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, toRefs } from '@vue/composition-api';
import useCollection from '@/composables/use-collection/';
import Draggable from 'vuedraggable';
import { Field } from '@/stores/fields/types';
import useFieldsStore from '@/stores/fields/';
import FieldSelect from '../field-select/';
import FieldSetup from '../field-setup/';
import { sortBy } from 'lodash';

type DraggableEvent = {
	moved?: {
		element: Field;
		newIndex: number;
		oldIndex: number;
	};
	added?: {
		element: Field;
		newIndex: number;
	};
};

export default defineComponent({
	components: { Draggable, FieldSelect, FieldSetup },
	props: {
		collection: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const { collection } = toRefs(props);
		const { fields } = useCollection(collection);
		const fieldsStore = useFieldsStore();

		const sortedVisibleFields = computed(() =>
			sortBy(
				[...fields.value].filter(({ hidden_detail }) => hidden_detail === false),
				(field) => field.sort || Infinity
			)
		);

		const sortedHiddenFields = computed(() =>
			sortBy(
				[...fields.value].filter(({ hidden_detail }) => hidden_detail === true),
				(field) => field.sort || Infinity
			)
		);

		const { fieldSetupActive, editingField, openFieldSetup, closeFieldSetup } = useFieldSetup();

		return {
			sortedVisibleFields,
			sortedHiddenFields,
			handleChange,
			toggleVisibility,
			fieldSetupActive,
			editingField,
			openFieldSetup,
			closeFieldSetup,
		};

		function handleChange(event: DraggableEvent, location: 'visible' | 'hidden') {
			if (event.added !== undefined) {
				addToGroup(event.added, location);
			}

			if (event.moved !== undefined) {
				sortInGroup(event.moved, location);
			}
		}

		function toggleVisibility(field: Field, location: 'visible' | 'hidden') {
			const fields =
				location === 'hidden' ? sortedVisibleFields.value : sortedHiddenFields.value;

			handleChange(
				{ added: { element: field, newIndex: fields.length } },
				location === 'hidden' ? 'visible' : 'hidden'
			);
		}

		function addToGroup(
			event: Required<DraggableEvent>['added'],
			location: 'visible' | 'hidden'
		) {
			/** @NOTE Adding to one group also means removing from the other */

			const { element, newIndex } = event;

			const fieldsInGroup =
				location === 'visible' ? sortedVisibleFields.value : sortedHiddenFields.value;

			const updates: Partial<Field>[] = fieldsInGroup.slice(newIndex).map((field) => {
				const sortValue =
					field.sort ||
					fieldsInGroup.findIndex((existingField) => existingField.field === field.field);

				return {
					field: field.field,
					sort: sortValue + 1,
				};
			});

			const addedToEnd = newIndex === fieldsInGroup.length;

			let newSortValue = fieldsInGroup[newIndex]?.sort;

			if (!newSortValue && addedToEnd) {
				const previousItem = fieldsInGroup[newIndex - 1];
				if (previousItem && previousItem.sort) newSortValue = previousItem.sort + 1;
			}

			if (!newSortValue) {
				newSortValue = newIndex;
			}

			updates.push({
				field: element.field,
				sort: newSortValue,
				hidden_detail: location === 'hidden',
			});

			fieldsStore.updateFields(element.collection, updates);
		}

		function sortInGroup(
			event: Required<DraggableEvent>['moved'],
			location: 'visible' | 'hidden'
		) {
			const { element, newIndex, oldIndex } = event;
			const move = newIndex > oldIndex ? 'down' : 'up';

			const selectionRange =
				move === 'down' ? [oldIndex + 1, newIndex + 1] : [newIndex, oldIndex];

			const fields =
				location === 'visible' ? sortedVisibleFields.value : sortedHiddenFields.value;

			const updates: Partial<Field>[] = fields.slice(...selectionRange).map((field) => {
				// If field.sort isn't set yet, base it on the index of the array. That way, the
				// new sort value will match what's visible on the screen
				const sortValue =
					field.sort ||
					fields.findIndex((existingField) => existingField.field === field.field);

				return {
					field: field.field,
					sort: move === 'down' ? sortValue - 1 : sortValue + 1,
				};
			});

			const sortOfItemOnNewIndex = fields[newIndex].sort || newIndex;
			updates.push({
				field: element.field,
				sort: sortOfItemOnNewIndex,
			});

			fieldsStore.updateFields(element.collection, updates);
		}

		function useFieldSetup() {
			const fieldSetupActive = ref(false);
			const editingField = ref<Field>(null);

			return { fieldSetupActive, editingField, openFieldSetup, closeFieldSetup };

			function openFieldSetup(field: Field | null) {
				if (field) {
					editingField.value = field;
				}

				fieldSetupActive.value = true;
			}

			function closeFieldSetup() {
				editingField.value = null;
				fieldSetupActive.value = false;
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.v-divider {
	margin: 32px 0;
}

.field-grid {
	position: relative;
	display: grid;
	grid-gap: 12px;
	grid-template-columns: 1fr 1fr;
	margin-bottom: 24px;
	padding: 32px 12px 72px 12px;
	background-color: var(--background-subdued);
	border-radius: var(--border-radius);

	.group-name {
		position: absolute;
		top: 6px;
		left: 12px;
		margin-bottom: 8px;
		color: var(--foreground-subdued);
	}

	.add-field {
		--v-button-width: 100%;
		--v-button-font-size: 14px;
		--v-button-background-color: var(--foreground-subdued);
		--v-button-background-color-hover: var(--primary);

		position: absolute;
		bottom: 12px;
		left: 12px;
		width: calc(100% - 24px);
	}
}

.visible {
	margin-bottom: 24px;
}

.list-move {
	transition: transform 0.5s;
}
</style>
