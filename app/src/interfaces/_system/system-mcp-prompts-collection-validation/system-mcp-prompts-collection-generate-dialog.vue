<script lang="ts" setup>
import api from '@/api';
import { defineModel, ref, computed, defineProps } from 'vue';
import { useI18n } from 'vue-i18n';
import { generateFields } from './schema';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';

const { t } = useI18n();

const collectionsStore = useCollectionsStore();
const fieldsStore = useFieldsStore();
const relationsStore = useRelationsStore();

const active = defineModel<boolean>('active');

const saving = ref(false);

const customCollectionName = ref('ai_prompts');

const fieldsToCreate = computed(() => {
	return generateFields(props.collection ?? customCollectionName.value, props.fields);
});

const props = withDefaults(
	defineProps<{
		collection?: string | null;
		fields?: string[] | null;
	}>(),
	{
		collection: null,
		fields: null,
	},
);

async function generateCollection() {
	saving.value = true;

	try {
		await api.post(`/collections`, {
			collection: customCollectionName.value,
			fields: fieldsToCreate.value,
			schema: {},
			meta: {
				sort_field: 'sort',
				archive_field: 'status',
				archive_value: 'archived',
				unarchive_value: 'draft',
				singleton: false,
			},
		});

		const storeHydrations: Promise<void>[] = [];

		const relations = [
			{
				collection: customCollectionName.value!,
				field: 'user_created',
				related_collection: 'directus_users',
				schema: {},
			},
			{
				collection: customCollectionName.value!,
				field: 'user_updated',
				related_collection: 'directus_users',
				schema: {},
			},
		];

		if (relations.length > 0) {
			const requests = relations.map((relation) => api.post('/relations', relation));
			await Promise.all(requests);
			storeHydrations.push(relationsStore.hydrate());
		}

		storeHydrations.push(collectionsStore.hydrate(), fieldsStore.hydrate());
		await Promise.all(storeHydrations);

		notify({
			title: t('collection_created'),
		});
	} catch (error) {
		unexpectedError(error);
	} finally {
		saving.value = false;
		active.value = false;
	}
}
</script>

<template>
	<v-dialog v-model="active">
		<v-card>
			<v-card-title v-if="collection">{{ t('mcp_prompts_collection.generate_fields_dialog_title') }}</v-card-title>
			<v-card-title v-else>{{ t('mcp_prompts_collection.generate_collection_dialog_title') }}</v-card-title>
			<v-card-text>
				<p v-if="collection">
					{{ t('mcp_prompts_collection.generate_fields_dialog_description', { collection }) }}
				</p>

				<p v-else>
					{{ t('mcp_prompts_collection.generate_collection_dialog_description', { collection: customCollectionName }) }}
				</p>
				<div class="grid">
					<div v-if="!collection" class="field full">
						<div class="type-label">
							{{ t('name') }}
							<v-icon v-tooltip="t('required')" class="required" name="star" sup filled />
						</div>
						<v-input
							v-model="customCollectionName"
							autofocus
							class="monospace"
							db-safe
							:placeholder="t('a_unique_table_name')"
						/>
						<small class="type-note">{{ t('collection_names_are_case_sensitive') }}</small>
					</div>
				</div>
				<!-- Show fields to be created -->
				<v-notice v-if="fieldsToCreate?.length > 0" class="generated-data" type="warning" multiline>
					<template #title>
						{{ t('new_data_alert') }}
					</template>
					<span>
						<ul>
							<li v-for="(data, index) in fieldsToCreate" :key="index">
								<span class="field-name">{{ `${data.collection}.${data.field}` }}</span>
							</li>
						</ul>
					</span>
				</v-notice>
			</v-card-text>
			<v-card-actions>
				<v-button secondary @click="active = false">{{ t('cancel') }}</v-button>
				<v-button :loading="saving" :disabled="saving || !customCollectionName" @click="generateCollection">
					{{ t('generate') }}
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.grid {
	@include mixins.form-grid;
	padding-block-start: 8px;
}

.v-input.monospace {
	--v-input-font-family: var(--theme--fonts--monospace--font-family);
}

.generated-data {
	margin-block-start: 24px;

	ul {
		padding-block-start: 4px;
		padding-inline-start: 24px;
	}

	.field-name {
		font-family: var(--theme--fonts--monospace--font-family);
	}
}
</style>
