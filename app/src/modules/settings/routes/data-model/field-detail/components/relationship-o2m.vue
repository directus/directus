<template>
	<div>
		<div class="grid">
			<div class="field">
				<div class="type-label">{{ $t('this_collection') }}</div>
				<v-input disabled :value="collection" />
			</div>
			<div class="field">
				<div class="type-label">{{ $t('related_collection') }}</div>
				<v-input
					db-safe
					:placeholder="$t('collection') + '...'"
					v-model="relations[0].many_collection"
					:nullable="false"
					:disabled="isExisting"
					:class="{ matches: relatedCollectionExists }"
				>
					<template #append v-if="!isExisting">
						<v-menu show-arrow placement="bottom-end">
							<template #activator="{ toggle }">
								<v-icon name="list_alt" @click="toggle" v-tooltip="$t('select_existing')" :disabled="isExisting" />
							</template>

							<v-list class="monospace">
								<v-list-item
									v-for="collection in availableCollections"
									:key="collection.collection"
									:active="relations[0].many_collection === collection.collection"
									@click="relations[0].many_collection = collection.collection"
								>
									<v-list-item-content>
										{{ collection.collection }}
									</v-list-item-content>
								</v-list-item>

								<v-divider />

								<v-list-group>
									<template #activator>{{ $t('system') }}</template>
									<v-list-item
										v-for="collection in systemCollections"
										:key="collection.collection"
										:active="relations[0].many_collection === collection.collection"
										@click="relations[0].many_collection = collection.collection"
									>
										<v-list-item-content>
											{{ collection.collection }}
										</v-list-item-content>
									</v-list-item>
								</v-list-group>
							</v-list>
						</v-menu>
					</template>

					<template #input v-if="isExisting">
						<v-text-overflow :text="relations[0].many_collection" />
					</template>
				</v-input>
			</div>
			<v-input disabled :value="currentCollectionPrimaryKey.field">
				<template #input>
					<v-text-overflow :text="currentCollectionPrimaryKey.field" />
				</template>
			</v-input>
			<v-input
				db-safe
				v-model="relations[0].many_field"
				:nullable="false"
				:disabled="isExisting"
				:placeholder="$t('foreign_key') + '...'"
				:class="{ matches: relatedFieldExists }"
			>
				<template #append v-if="fields && fields.length > 0 && !isExisting">
					<v-menu show-arrow placement="bottom-end">
						<template #activator="{ toggle }">
							<v-icon name="list_alt" @click="toggle" v-tooltip="$t('select_existing')" />
						</template>

						<v-list class="monospace">
							<v-list-item
								v-for="field in fields"
								:key="field.value"
								:active="relations[0].many_field === field.value"
								@click="relations[0].many_field = field.value"
								:disabled="field.disabled"
							>
								<v-list-item-content>
									{{ field.text }}
								</v-list-item-content>
							</v-list-item>
						</v-list>
					</v-menu>
				</template>

				<template #input v-if="isExisting">
					<v-text-overflow :text="relations[0].many_field" />
				</template>
			</v-input>
			<v-icon class="arrow" name="arrow_forward" />
		</div>

		<v-divider large :inline-title="false" v-if="!isExisting">{{ $t('corresponding_field') }}</v-divider>

		<div class="corresponding" v-if="!isExisting">
			<div class="field">
				<div class="type-label">{{ $t('create_field') }}</div>
				<v-checkbox block :disabled="isExisting" :label="correspondingLabel" v-model="hasCorresponding" />
			</div>
			<div class="field">
				<div class="type-label">{{ $t('field_name') }}</div>
				<v-input disabled v-model="relations[0].many_field" :placeholder="$t('field_name') + '...'" db-safe />
			</div>
			<v-icon name="arrow_forward" class="arrow" />
		</div>

		<div class="sort-field">
			<v-divider large :inline-title="false">{{ $t('sort_field') }}</v-divider>

			<v-input
				db-safe
				v-model="relations[0].sort_field"
				:placeholder="$t('add_sort_field') + '...'"
				:class="{ matches: sortFieldExists }"
			>
				<template #append v-if="fields && fields.length > 0 && !isExisting">
					<v-menu show-arrow placement="bottom-end">
						<template #activator="{ toggle }">
							<v-icon name="list_alt" @click="toggle" v-tooltip="$t('select_existing')" />
						</template>

						<v-list class="monospace">
							<v-list-item
								v-for="field in fields"
								:key="field.value"
								:active="relations[0].sort_field === field.value"
								@click="relations[0].sort_field = field.value"
								:disabled="field.disabled"
							>
								<v-list-item-content>
									{{ field.text }}
								</v-list-item-content>
							</v-list-item>
						</v-list>
					</v-menu>
				</template>
			</v-input>
		</div>

		<v-notice class="generated-data" v-if="generationInfo.length > 0" type="warning">
			<span>
				{{ $t('new_data_alert') }}

				<ul>
					<li v-for="(data, index) in generationInfo" :key="index">
						<span class="field-name">{{ data.name }}</span>
						({{ $t(data.type === 'field' ? 'new_field' : 'new_collection') }})
					</li>
				</ul>
			</span>
		</v-notice>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import { Field } from '@/types';
import { useFieldsStore, useCollectionsStore } from '@/stores';
import { orderBy } from 'lodash';
import i18n from '@/lang';
import { state, generationInfo } from '../store';

export default defineComponent({
	props: {
		type: {
			type: String,
			required: true,
		},
		collection: {
			type: String,
			required: true,
		},
		isExisting: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();

		const {
			availableCollections,
			systemCollections,
			fields,
			currentCollectionPrimaryKey,
			collectionMany,
		} = useRelation();
		const { hasCorresponding, correspondingLabel } = useCorresponding();

		const relatedCollectionExists = computed(() => {
			return (
				collectionsStore.state.collections.find((col) => col.collection === state.relations?.[0].many_collection) !==
				undefined
			);
		});

		const relatedFieldExists = computed(() => {
			if (!state?.relations?.[0].many_collection || !state?.relations?.[0].many_field) return false;
			return !!fieldsStore.getField(state.relations[0].many_collection, state.relations[0].many_field);
		});

		const sortFieldExists = computed(() => {
			if (!state?.relations?.[0].many_collection || !state?.relations?.[0].sort_field) return false;
			return !!fieldsStore.getField(state.relations[0].many_collection, state.relations[0].sort_field);
		});

		return {
			relations: state.relations,
			availableCollections,
			systemCollections,
			fields,
			currentCollectionPrimaryKey,
			collectionMany,
			hasCorresponding,
			correspondingLabel,
			relatedCollectionExists,
			relatedFieldExists,
			generationInfo,
			sortFieldExists,
		};

		function useRelation() {
			const availableCollections = computed(() => {
				return orderBy(
					collectionsStore.state.collections.filter((collection) => {
						return collection.collection.startsWith('directus_') === false;
					}),
					['collection'],
					['asc']
				);
			});

			const systemCollections = computed(() => {
				return orderBy(
					collectionsStore.state.collections.filter((collection) => {
						return collection.collection.startsWith('directus_') === true;
					}),
					['collection'],
					['asc']
				);
			});

			const currentCollectionPrimaryKey = computed(() => fieldsStore.getPrimaryKeyFieldForCollection(props.collection));

			const fields = computed(() => {
				if (!state.relations[0].many_collection) return [];

				return fieldsStore
					.getFieldsForCollectionAlphabetical(state.relations[0].many_collection)
					.map((field: Field) => ({
						text: field.field,
						value: field.field,
						disabled:
							!field.schema || field.schema?.is_primary_key || field.type !== currentCollectionPrimaryKey.value.type,
					}));
			});

			const collectionMany = computed({
				get() {
					return state.relations[0].many_collection!;
				},
				set(collection: string) {
					state.relations[0].many_collection = collection;
					state.relations[0].many_field = '';
				},
			});

			return { availableCollections, systemCollections, fields, currentCollectionPrimaryKey, collectionMany };
		}

		function useCorresponding() {
			const hasCorresponding = computed({
				get() {
					if (!state?.relations?.[0]?.many_collection || !state?.relations?.[0]?.many_field) return false;

					if (relatedFieldExists.value === true) {
						return (
							state.updateFields.find((updateField: any) => updateField.field === state.relations[0].many_field)?.meta
								?.interface === 'many-to-one' ||
							fieldsStore.getField(state.relations[0].many_collection, state.relations[0].many_field)?.meta
								?.interface === 'many-to-one'
						);
					} else {
						return (
							state.newFields.find((newField: any) => newField.$type === 'manyRelated')?.meta?.interface ===
							'many-to-one'
						);
					}
				},
				set(enabled: boolean) {
					if (!state?.relations?.[0]?.many_field) return;

					if (relatedFieldExists.value === true) {
						if (enabled === true) {
							state.updateFields = [
								{
									collection: state.relations[0].one_collection,
									field: state.relations[0].many_field,
									meta: {
										interface: 'many-to-one',
										special: 'm2o',
									},
								},
							];
						} else {
							state.updateFields = [
								{
									collection: state.relations[0].one_collection,
									field: state.relations[0].many_field,
									meta: {
										interface: null,
										special: null,
									},
								},
							];
						}
					} else {
						const newFieldCreated = !!state.newFields.find((newField: any) => newField.$type === 'manyRelated');

						if (newFieldCreated === false) {
							state.newFields = [
								...state.newFields,
								{
									$type: 'manyRelated',
									collection: state.relations[0].one_collection,
									field: state.relations[0].many_field,
									meta: {
										interface: 'many-to-one',
										special: 'm2o',
									},
								},
							];
						} else {
							state.newFields = state.newFields.map((newField: any) => {
								if (newField.$type === 'manyRelated') {
									if (!newField.meta) newField.meta = {};
									if (enabled === true) {
										newField.meta.interface = 'many-to-one';
										newField.meta.special = ['m2o'];
									} else {
										newField.meta.interface = null;
										newField.meta.special = null;
									}
								}

								return newField;
							});
						}
					}
				},
			});

			const correspondingLabel = computed(() => {
				if (state.relations[0].many_collection) {
					return i18n.t('add_m2o_to_collection', { collection: state.relations[0].many_collection });
				}

				return i18n.t('add_field_related');
			});

			return { hasCorresponding, correspondingLabel };
		}
	},
});
</script>

<style lang="scss" scoped>
.grid {
	--v-select-font-family: var(--family-monospace);
	--v-input-font-family: var(--family-monospace);

	position: relative;
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12px 32px;
	margin-top: 48px;

	.v-icon.arrow {
		--v-icon-color: var(--primary);

		position: absolute;
		bottom: 17px;
		left: 50%;
		transform: translateX(-50%);
	}
}

.v-input.matches {
	--v-input-color: var(--primary);
}

.v-list {
	--v-list-item-content-font-family: var(--family-monospace);
}

.type-label {
	margin-bottom: 8px;
}

.v-divider {
	margin: 48px 0;
}

.corresponding {
	position: relative;
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12px 32px;
	margin-top: 48px;

	.arrow {
		--v-icon-color: var(--primary);

		position: absolute;
		bottom: 17px;
		left: 50%;
		transform: translateX(-50%);
	}
}

.v-notice {
	margin-bottom: 36px;
}

.generated-data {
	margin-top: 36px;

	ul {
		padding-top: 4px;
		padding-left: 24px;
	}

	.field-name {
		font-family: var(--family-monospace);
	}
}

.sort-field {
	--v-input-font-family: var(--family-monospace);

	.v-divider {
		margin-top: 48px;
		margin-bottom: 24px;
	}
}
</style>
