/**
 * This is a "local store" meant to make the field data shareable between the different panes
 * and components within the field setup modal flow.
 *
 * It's reset every time the modal opens and shouldn't be used outside of the field-detail flow.
 */

import useFieldsStore from '@/stores/fields';
import useRelationsStore from '@/stores/relations';
import { reactive, watch } from '@vue/composition-api';

const fieldsStore = useFieldsStore();
const relationsStore = useRelationsStore();

const state = reactive<any>({
	fieldData: {
		field: '',
		type: '',
		database: {
			default_value: undefined,
			max_length: undefined,
			is_nullable: true,
		},
		system: {
			hidden: false,
			interface: undefined,
			options: undefined,
			display: undefined,
			display_options: undefined,
			readonly: false,
			special: undefined,
			note: undefined,
		},
	},
	relations: [],
	newFields: [],
});

export { state, initLocalStore, clearLocalStore };

function initLocalStore(
	collection: string,
	field: string,
	type: 'standard' | 'file' | 'files' | 'm2o' | 'o2m' | 'm2m'
) {
	const isExisting = field !== '+';

	if (isExisting) {
		const existingField = fieldsStore.getField(collection, field);

		state.fieldData.field = existingField.field;
		state.fieldData.type = existingField.type;
		state.fieldData.database = existingField.database;
		state.fieldData.system = existingField.system;

		state.relations = relationsStore.getRelationsForField(collection, field);
	}

	if (type === 'file') {
		if (!isExisting) {
			state.fieldData.type = 'uuid';

			state.relations = [
				{
					collection_many: collection,
					field_many: '',
					primary_many: fieldsStore.getPrimaryKeyFieldForCollection(collection)?.field,
					collection_one: 'directus_files',
					primary_one: fieldsStore.getPrimaryKeyFieldForCollection('directus_files')?.field,
				},
			];
		}

		watch(
			() => state.fieldData.field,
			() => {
				state.relations[0].field_many = state.fieldData.field;
			}
		);
	}

	if (type === 'm2o') {
		if (!isExisting) {
			state.relations = [
				{
					collection_many: collection,
					field_many: '',
					primary_many: fieldsStore.getPrimaryKeyFieldForCollection(collection)?.field,
					collection_one: '',
					primary_one: fieldsStore.getPrimaryKeyFieldForCollection('directus_files')?.field,
				},
			];
		}

		watch(
			() => state.fieldData.field,
			() => {
				state.relations[0].field_many = state.fieldData.field;
			}
		);

		// Make sure to keep the current m2o field type in sync with the primary key of the
		// selected related collection
		watch(
			() => state.relations[0].collection_one,
			() => {
				const field = fieldsStore.getPrimaryKeyFieldForCollection(state.relations[0].collection_one);
				state.fieldData.type = field.type;
			}
		);

		watch(
			() => state.relations[0].collection_one,
			() => {
				if (state.newFields.length > 0) {
					state.newFields[0].collection = state.relations[0].collection_one;
				}
			}
		);
	}

	if (type === 'o2m') {
		delete state.fieldData.database;

		if (!isExisting) {
			state.fieldData.system.special = 'o2m';

			state.relations.push = [
				{
					collection_many: '',
					field_many: '',
					primary_many: '',

					collection_one: collection,
					field_one: state.fieldData.field,
					primary_one: fieldsStore.getPrimaryKeyFieldForCollection(collection)?.field,
				},
			];
		}

		watch(
			() => state.fieldData.field,
			() => {
				state.relations[0].field_one = state.fieldData.field;
			}
		);

		watch(
			() => state.relations[0].collection_many,
			() => {
				state.relations[0].primary_many = fieldsStore.getPrimaryKeyFieldForCollection(
					state.relations[0].collection_many
				).field;
			}
		);
	}

	if (type === 'm2m' || type === 'files') {
		delete state.fieldData.database;

		if (!isExisting) {
			state.fieldData.system.special = 'm2m';

			state.relations = [
				{
					collection_many: '',
					field_many: '',
					primary_many: '',
					collection_one: collection,
					field_one: state.fieldData.field,
					primary_one: fieldsStore.getPrimaryKeyFieldForCollection(collection)?.field,
				},
				{
					collection_many: '',
					field_many: '',
					primary_many: '',
					collection_one: type === 'files' ? 'directus_files' : '',
					field_one: null,
					primary_one:
						type === 'files' ? fieldsStore.getPrimaryKeyFieldForCollection('directus_files')?.field : '',
				},
			];
		}

		watch(
			() => state.fieldData.field,
			() => {
				state.relations[0].field_one = state.fieldData.field;
			}
		);

		watch(
			() => state.relations[0].collection_many,
			() => {
				const pkField = fieldsStore.getPrimaryKeyFieldForCollection(state.relations[0].collection_many)?.field;
				state.relations[0].primary_many = pkField;
				state.relations[1].primary_many = pkField;
			}
		);

		watch(
			() => state.relations[0].field_many,
			() => {
				state.relations[1].junction_field = state.relations[0].field_many;
			}
		);

		watch(
			() => state.relations[1].field_many,
			() => {
				state.relations[0].junction_field = state.relations[1].field_many;
			}
		);
	}
}

function clearLocalStore() {
	state.fieldData = {
		field: '',
		type: '',
		database: {
			default_value: undefined,
			max_length: undefined,
			is_nullable: true,
		},
		system: {
			hidden: false,
			interface: undefined,
			options: undefined,
			display: undefined,
			display_options: undefined,
			readonly: false,
			special: undefined,
			note: undefined,
		},
	};

	state.relations = [];
	state.newFields = [];
}
