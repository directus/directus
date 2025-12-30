import { collectionExists } from '../../../utils/collection-exists';
import { fieldExists } from '../../../utils/field-exists';
import { getAutomaticJunctionCollectionName } from '../../../utils/get-junction-collection-name';
import { HelperFunctions, State, StateUpdates } from '../types';
import { useFieldsStore } from '@/stores/fields';
import { set } from 'lodash';

export function applyChanges(updates: StateUpdates, state: State, helperFn: HelperFunctions) {
	const { hasChanged } = helperFn;

	if (hasChanged('localType')) {
		removeSchema(updates);
		setTypeToAlias(updates);
		prepareRelation(updates, state);
		setDefaults(updates, state, helperFn);
	}

	if (hasChanged('autoGenerateJunctionRelation')) {
		setDefaults(updates, state, helperFn);
	}

	if (hasChanged('field.field')) {
		updateRelationField(updates);
		autoGenerateJunctionCollectionName(updates, state, helperFn);
	}

	if (hasChanged('relations.o2m.field')) {
		setJunctionFields(updates, state, helperFn);
	}

	if (hasChanged('relations.m2o.field')) {
		setJunctionFields(updates, state, helperFn);
	}

	if (hasChanged('relations.o2m.collection') || hasChanged('relations.m2o.collection')) {
		matchJunctionCollectionName(updates);
	}

	if (hasChanged('fields.corresponding')) {
		setRelatedOneFieldForCorrespondingField(updates);
	}

	if (
		[
			'relations.o2m.collection',
			'relations.o2m.field',
			'relations.m2o.field',
			'relations.o2m.meta.sort_field',
			'relations.m2o.meta.one_collection_field',
		].some(hasChanged)
	) {
		generateCollections(updates, state, helperFn);
		generateFields(updates, state, helperFn);
	}
}

export function removeSchema(updates: StateUpdates) {
	set(updates, 'field.schema', undefined);
}

export function setTypeToAlias(updates: StateUpdates) {
	set(updates, 'field.type', 'alias');
}

export function prepareRelation(updates: StateUpdates, state: State) {
	if (!updates.relations) updates.relations = {};

	updates.relations.o2m = {
		collection: undefined,
		field: undefined,
		related_collection: state.collection,
		meta: {
			one_field: updates.field?.field ?? state.field.field,
			sort_field: null,
			one_deselect_action: 'nullify',
		},
		schema: {
			on_delete: 'SET NULL',
		},
	};

	updates.relations.m2o = {
		collection: undefined,
		field: undefined,
		related_collection: null,
		meta: {
			one_field: null,
			sort_field: null,
			one_deselect_action: 'nullify',
		},
		schema: null,
	};
}

export function setDefaults(updates: StateUpdates, state: State, { getCurrent }: HelperFunctions) {
	if (getCurrent('autoGenerateJunctionRelation') === false) return;

	const fieldsStore = useFieldsStore();

	const currentCollection = state.collection!;

	const currentCollectionPrimaryKeyField =
		fieldsStore.getPrimaryKeyFieldForCollection(currentCollection)?.field ?? 'id';

	const junctionName = getAutomaticJunctionCollectionName(currentCollection, getCurrent('field.field'));

	set(updates, 'relations.o2m.collection', junctionName);
	set(updates, 'relations.o2m.field', `${currentCollection}_${currentCollectionPrimaryKeyField}`);
	set(updates, 'relations.m2o.collection', junctionName);
	set(updates, 'relations.m2o.field', 'item');

	set(
		updates,
		'relations.m2o.meta.one_allowed_collections',
		getCurrent('relations.m2o.meta.one_allowed_collections') ?? [],
	);

	set(updates, 'relations.m2o.meta.one_collection_field', 'collection');
}

export function autoGenerateJunctionCollectionName(
	updates: StateUpdates,
	state: State,
	{ getCurrent }: HelperFunctions,
) {
	if (getCurrent('autoGenerateJunctionRelation') === false) return;

	set(
		updates,
		'relations.o2m.collection',
		getAutomaticJunctionCollectionName(getCurrent('collection'), getCurrent('field.field')),
	);
}

export function updateRelationField(updates: StateUpdates) {
	if (!updates.field?.field) return;

	if (!updates.relations?.o2m) updates.relations = { o2m: {} };
	set(updates, 'relations.o2m.meta.one_field', updates.field.field);
}

export function preventCircularConstraint(updates: StateUpdates, _state: State, { getCurrent }: HelperFunctions) {
	if (getCurrent('relations.o2m.collection') === getCurrent('relations.o2m.related_collection')) {
		set(updates, 'relations.o2m.schema.on_delete', 'NO ACTION');
	}
}

export function setJunctionFields(updates: StateUpdates, _state: State, { getCurrent }: HelperFunctions) {
	set(updates, 'relations.o2m.meta.junction_field', getCurrent('relations.m2o.field'));
	set(updates, 'relations.m2o.meta.junction_field', getCurrent('relations.o2m.field'));
}

export function generateCollections(updates: StateUpdates, state: State, { getCurrent }: HelperFunctions) {
	const junctionCollection = getCurrent('relations.o2m.collection');

	if (!junctionCollection || collectionExists(junctionCollection)) {
		set(updates, 'collections.junction', undefined);
	} else {
		set(updates, 'collections.junction', {
			collection: junctionCollection,
			meta: {
				hidden: true,
				icon: 'import_export',
			},
			schema: {
				name: junctionCollection,
			},
			fields: [
				{
					field: 'id',
					type: 'integer',
					schema: {
						has_auto_increment: true,
					},
					meta: {
						hidden: true,
					},
				},
			],
		});
	}
}

function generateFields(updates: StateUpdates, state: State, { getCurrent }: HelperFunctions) {
	const fieldsStore = useFieldsStore();
	const currentPrimaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(state.collection!);
	const junctionCollection = getCurrent('relations.o2m.collection');
	const junctionCurrent = getCurrent('relations.o2m.field');
	const junctionRelated = getCurrent('relations.m2o.field');
	const oneCollectionField = getCurrent('relations.m2o.meta.one_collection_field');
	const sort = getCurrent('relations.o2m.meta.sort_field');

	if (junctionCollection && junctionCurrent && fieldExists(junctionCollection, junctionCurrent) === false) {
		set(updates, 'fields.junctionCurrent', {
			collection: junctionCollection,
			field: junctionCurrent,
			type: currentPrimaryKeyField?.type ?? 'integer',
			schema: {},
			meta: {
				hidden: true,
			},
		});
	} else {
		set(updates, 'fields.junctionCurrent', undefined);
	}

	if (junctionCollection && junctionRelated && fieldExists(junctionCollection, junctionRelated) === false) {
		set(updates, 'fields.junctionRelated', {
			collection: junctionCollection,
			field: junctionRelated,
			// We'll have to save the foreign key as a string, as that's the only way to safely
			// be able to store the PK of multiple typed collections
			type: 'string',
			schema: {},
			meta: {
				hidden: true,
			},
		});
	} else {
		set(updates, 'fields.junctionRelated', undefined);
	}

	if (junctionCollection && oneCollectionField && fieldExists(junctionCollection, oneCollectionField) === false) {
		set(updates, 'fields.oneCollectionField', {
			collection: junctionCollection,
			field: oneCollectionField,
			// directus_collections.collection is a string
			type: 'string',
			schema: {},
			meta: {
				hidden: true,
			},
		});
	} else {
		set(updates, 'fields.oneCollectionField', undefined);
	}

	if (junctionCollection && sort && fieldExists(junctionCollection, sort) === false) {
		set(updates, 'fields.sort', {
			collection: junctionCollection,
			field: sort,
			type: 'integer',
			schema: {},
			meta: {
				hidden: true,
			},
		});
	} else {
		set(updates, 'fields.sort', undefined);
	}
}

export function matchJunctionCollectionName(updates: StateUpdates) {
	if (updates?.relations?.o2m?.collection && updates.relations.o2m.collection !== updates.relations.m2o?.collection) {
		set(updates, 'relations.m2o.collection', updates.relations.o2m.collection);
	}

	if (updates?.relations?.m2o?.collection && updates.relations.m2o.collection !== updates.relations.o2m?.collection) {
		set(updates, 'relations.o2m.collection', updates.relations.m2o.collection);
	}
}

export function setRelatedOneFieldForCorrespondingField(updates: StateUpdates) {
	if (updates?.fields?.corresponding?.field) {
		set(updates, 'relations.m2o.meta.one_field', updates.fields.corresponding.field);
	}

	if (!updates.fields?.corresponding) {
		set(updates, 'relations.m2o.meta.one_field', null);
	}
}
