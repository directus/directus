<template>
	<div>
		<v-notice type="info">{{ $t('configure_m2a') }}</v-notice>

		<div class="grid">
			<div class="field">
				<div class="type-label">{{ $t('this_collection') }}</div>
				<v-input disabled :value="relations[0].one_collection" />
			</div>
			<div class="field">
				<div class="type-label">{{ $t('junction_collection') }}</div>
				<v-input
					:class="{ matches: junctionCollectionExists }"
					v-model="junctionCollection"
					:nullable="false"
					:placeholder="$t('collection') + '...'"
					:disabled="autoFill || isExisting"
					db-safe
				>
					<template #append>
						<v-menu show-arrow placement="bottom-end">
							<template #activator="{ toggle }">
								<v-icon
									name="list_alt"
									@click="toggle"
									v-tooltip="$t('select_existing')"
									:disabled="autoFill || isExisting"
								/>
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
				</v-input>
			</div>
			<div class="field">
				<div class="type-label">{{ $t('related_collections') }}</div>

				<v-select
					:disabled="isExisting"
					:placeholder="$t('collection') + '...'"
					:items="availableCollections"
					item-value="collection"
					item-text="name"
					multiple
					v-model="relations[1].one_allowed_collections"
					:multiple-preview-threshold="0"
				/>
			</div>
			<v-input disabled :value="relations[0].one_primary" />
			<v-input
				:class="{ matches: junctionFieldExists(relations[0].many_field) }"
				v-model="relations[0].many_field"
				:nullable="false"
				:placeholder="$t('foreign_key') + '...'"
				:disabled="autoFill || isExisting"
				db-safe
			>
				<template #append v-if="junctionCollectionExists">
					<v-menu show-arrow placement="bottom-end">
						<template #activator="{ toggle }">
							<v-icon
								name="list_alt"
								@click="toggle"
								v-tooltip="$t('select_existing')"
								:disabled="autoFill || isExisting"
							/>
						</template>

						<v-list class="monospace">
							<v-list-item
								v-for="item in junctionFields"
								:key="item.value"
								:active="relations[0].many_field === item.value"
								:disabled="item.disabled"
								@click="relations[0].many_field = item.value"
							>
								<v-list-item-content>
									{{ item.text }}
								</v-list-item-content>
							</v-list-item>
						</v-list>
					</v-menu>
				</template>
			</v-input>
			<div class="related-collections-preview">{{ (relations[1].one_allowed_collections || []).join(', ') }}</div>
			<div class="spacer" />
			<v-input
				class="one-collection-field"
				:class="{ matches: junctionFieldExists(relations[0].one_collection_field) }"
				v-model="relations[1].one_collection_field"
				:nullable="false"
				:placeholder="$t('collection_key') + '...'"
				:disabled="autoFill || isExisting"
				db-safe
			>
				<template #append v-if="junctionCollectionExists">
					<v-menu show-arrow placement="bottom-end">
						<template #activator="{ toggle }">
							<v-icon
								name="list_alt"
								@click="toggle"
								v-tooltip="$t('select_existing')"
								:disabled="autoFill || isExisting"
							/>
						</template>

						<v-list class="monospace">
							<v-list-item
								v-for="item in junctionFields"
								:key="item.value"
								:active="relations[0].many_field === item.value"
								:disabled="item.disabled"
								@click="relations[0].many_field = item.value"
							>
								<v-list-item-content>
									{{ item.text }}
								</v-list-item-content>
							</v-list-item>
						</v-list>
					</v-menu>
				</template>
			</v-input>
			<div class="spacer" />
			<v-input
				:class="{ matches: junctionFieldExists(relations[1].many_field) }"
				v-model="relations[1].many_field"
				:nullable="false"
				:placeholder="$t('foreign_key') + '...'"
				:disabled="autoFill || isExisting"
				db-safe
			>
				<template #append v-if="junctionCollectionExists">
					<v-menu show-arrow placement="bottom-end">
						<template #activator="{ toggle }">
							<v-icon
								name="list_alt"
								@click="toggle"
								v-tooltip="$t('select_existing')"
								:disabled="autoFill || isExisting"
							/>
						</template>

						<v-list class="monospace">
							<v-list-item
								v-for="item in junctionFields"
								:key="item.value"
								:active="relations[1].many_field === item.value"
								:disabled="item.disabled"
								@click="relations[1].many_field = item.value"
							>
								<v-list-item-content>
									{{ item.text }}
								</v-list-item-content>
							</v-list-item>
						</v-list>
					</v-menu>
				</template>
			</v-input>
			<v-input disabled :value="$t('primary_key')" />
			<div class="spacer" />
			<v-checkbox :disabled="isExisting" block v-model="autoFill" :label="$t('auto_fill')" />
			<v-icon class="arrow" name="arrow_forward" />
			<v-icon class="arrow" name="arrow_backward" />
			<v-icon class="arrow" name="arrow_backward" />
		</div>

		<div class="sort-field">
			<v-divider large :inline-title="false">{{ $t('sort_field') }}</v-divider>

			<v-input
				:class="{ matches: junctionFieldExists(relations[0].sort_field) }"
				v-model="relations[0].sort_field"
				:nullable="false"
				:placeholder="$t('add_sort_field') + '...'"
				db-safe
			>
				<template #append v-if="junctionCollectionExists">
					<v-menu show-arrow placement="bottom-end">
						<template #activator="{ toggle }">
							<v-icon name="list_alt" @click="toggle" v-tooltip="$t('select_existing')" />
						</template>

						<v-list class="monospace">
							<v-list-item
								v-for="item in junctionFields"
								:key="item.value"
								:active="relations[0].sort_field === item.value"
								:disabled="item.disabled"
								@click="relations[0].sort_field = item.value"
							>
								<v-list-item-content>
									{{ item.text }}
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
import { orderBy } from 'lodash';
import { useCollectionsStore, useFieldsStore } from '@/stores/';
import { Field } from '@/types';

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
	setup() {
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();

		const autoFill = computed({
			get() {
				return state.autoFillJunctionRelation;
			},
			set(newAuto: boolean) {
				state.autoFillJunctionRelation = newAuto;
			},
		});

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

		const junctionCollection = computed({
			get() {
				return state.relations[0].many_collection;
			},
			set(collection: string) {
				state.relations[0].many_collection = collection;
				state.relations[1].many_collection = collection;
			},
		});

		const junctionCollectionExists = computed(() => {
			return collectionsStore.getCollection(junctionCollection.value) !== null;
		});

		const junctionFields = computed(() => {
			if (!junctionCollection.value) return [];

			return fieldsStore.getFieldsForCollection(junctionCollection.value).map((field: Field) => ({
				text: field.field,
				value: field.field,
				disabled:
					state.relations[0].many_field === field.field ||
					field.schema?.is_primary_key ||
					state.relations[1].many_field === field.field,
			}));
		});

		return {
			relations: state.relations,
			autoFill,
			availableCollections,
			systemCollections,
			junctionCollection,
			junctionFields,
			junctionCollectionExists,
			junctionFieldExists,
			generationInfo,
		};

		function junctionFieldExists(fieldKey: string) {
			if (!junctionCollection.value || !fieldKey) return false;
			return !!fieldsStore.getField(junctionCollection.value, fieldKey);
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
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 12px 28px;
	margin-top: 48px;

	.v-icon.arrow {
		--v-icon-color: var(--primary);

		position: absolute;
		transform: translateX(-50%);
		pointer-events: none;

		&:first-of-type {
			top: 105px;
			left: 32.5%;
		}

		&:nth-of-type(2) {
			bottom: 143px;
			left: 67.4%;
		}

		&:last-of-type {
			bottom: 76px;
			left: 67.4%;
		}
	}
}

.v-input.matches {
	--v-input-color: var(--primary);
}

.type-label {
	margin-bottom: 8px;
}

.v-list {
	--v-list-item-content-font-family: var(--family-monospace);
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

.related-collections-preview {
	grid-column: 3;
	grid-row: 2 / span 2;
	padding: var(--input-padding);
	overflow: auto;
	color: var(--foreground-subdued);
	font-family: var(--family-monospace);
	background-color: var(--background-subdued);
	border: var(--border-width) solid var(--border-normal);
	border-radius: var(--border-radius);
}

.one-collection-field {
	align-self: flex-end;
}

.sort-field {
	--v-input-font-family: var(--family-monospace);

	.v-divider {
		margin-top: 48px;
		margin-bottom: 24px;
	}
}
</style>
