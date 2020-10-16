<template>
	<div v-if="languagesLoading">
		<v-skeleton-loader v-for="n in 5" :key="n" />
	</div>

	<div class="translations" v-else>
		<button
			v-for="languageItem in languages"
			:key="languageItem[languagesPrimaryKeyField]"
			@click="startEditing(languageItem[languagesPrimaryKeyField])"
			class="language-row"
		>
			<v-icon class="translate" name="translate" />
			<render-template :template="languagesTemplate" :collection="languagesCollection" :item="languageItem" />
			<div class="spacer" />
			<v-icon class="launch" name="launch" />
		</button>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref, watch } from '@vue/composition-api';
import { useRelationsStore, useFieldsStore } from '@/stores/';
import api from '@/api';
import { Relation } from '@/types';
import getFieldsFromTemplate from '@/utils/get-fields-from-template';

export default defineComponent({
	props: {
		collection: {
			type: String,
			required: true,
		},
		field: {
			type: String,
			required: true,
		},
		primaryKey: {
			type: String,
			required: true,
		},
		template: {
			type: String,
			default: null,
		},
		value: {
			type: Array as PropType<(string | number | Record<string, any>)[]>,
			default: () => [],
		},
	},
	setup(props, { emit }) {
		const relationsStore = useRelationsStore();
		const fieldsStore = useFieldsStore();

		const { relationsForField, relationTranslations, relationLanguages } = useRelations();

		const {
			languages,
			loading: languagesLoading,
			error: languagesError,
			template: languagesTemplate,
			collection: languagesCollection,
			primaryKeyField: languagesPrimaryKeyField,
		} = useLanguages();

		const { startEditing } = useEdits();

		return {
			relationsForField,
			relationTranslations,
			relationLanguages,
			languages,
			languagesTemplate,
			languagesCollection,
			languagesPrimaryKeyField,
			languagesLoading,
			startEditing,
		};

		function useRelations() {
			const relationsForField = computed(() => {
				return relationsStore.getRelationsForField(props.collection, props.field);
			});

			const relationTranslations = computed(() => {
				if (!relationsForField.value) return null;
				return (
					relationsForField.value.find(
						(relation: Relation) =>
							relation.one_collection === props.collection && relation.one_field === props.field
					) || null
				);
			});

			const relationLanguages = computed(() => {
				if (!relationsForField.value) return null;
				return (
					relationsForField.value.find((relation: Relation) => relation !== relationTranslations.value) ||
					null
				);
			});

			return { relationsForField, relationTranslations, relationLanguages };
		}

		function useLanguages() {
			const languages = ref();
			const loading = ref(false);
			const error = ref<any>(null);

			const collection = computed(() => {
				if (!relationLanguages.value) return null;
				return relationLanguages.value.one_collection;
			});

			const primaryKeyField = computed(() => {
				if (!collection.value) return null;
				return fieldsStore.getPrimaryKeyFieldForCollection(collection.value).field;
			});

			const template = computed(() => {
				if (!primaryKeyField.value) return '';
				return props.template || `{{ ${primaryKeyField.value} }}`;
			});

			watch(collection, fetchLanguages, { immediate: true });

			return { languages, loading, error, collection, template, primaryKeyField };

			async function fetchLanguages() {
				if (!collection.value) return;

				const fields = getFieldsFromTemplate(template.value);

				loading.value = true;

				try {
					const response = await api.get(`/items/${collection.value}`, { params: { fields } });
					languages.value = response.data.data;
				} catch (err) {
					error.value = err;
				} finally {
					loading.value = false;
				}
			}
		}

		function useEdits() {
			return { startEditing };

			function startEditing(language: string | number) {
				console.log('start editing ' + language);
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.language-row {
	--v-icon-color: var(--foreground-subdued);

	display: flex;
	align-items: center;
	width: 100%;
	padding: 12px;
	text-align: left;
	background-color: var(--background-subdued);
	border-radius: var(--border-radius);

	& + & {
		margin-top: 8px;
	}

	.translate {
		margin-right: 12px;
	}

	.spacer {
		flex-grow: 1;
	}

	.launch {
		transition: color var(--fast) var(--transition);
	}

	&:hover .launch {
		--v-icon-color: var(--foreground-normal);
	}
}
</style>
