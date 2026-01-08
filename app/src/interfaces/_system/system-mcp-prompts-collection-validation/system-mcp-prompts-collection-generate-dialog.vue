<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { generateFields } from './schema';
import api from '@/api';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VNotice from '@/components/v-notice.vue';
import VSkeletonLoader from '@/components/v-skeleton-loader.vue';
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

const collectionName = computed(() => {
	return props.collection ?? customCollectionName.value;
});

const collectionAlreadyExists = computed(() => {
	if (!collectionName.value) return false;

	return collectionsStore.getCollection(collectionName.value) !== null;
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

const emit = defineEmits<{
	save: [value: string];
}>();

async function generateCollection() {
	const collection: string = props.collection ?? customCollectionName.value;

	saving.value = true;

	try {
		if (props.collection) {
			for (const field of fieldsToCreate.value) {
				await api.post(`/fields/${props.collection}`, field);
			}
		} else {
			await api.post(`/collections`, {
				collection,
				fields: fieldsToCreate.value,
				schema: {},
				meta: {
					icon: 'magic_button',
					sort_field: 'sort',
					archive_field: 'status',
					archive_value: 'archived',
					unarchive_value: 'draft',
					singleton: false,
				},
			});
		}

		const storeHydrations: Promise<void>[] = [];

		let relations = [
			{
				collection,
				field: 'user_created',
				related_collection: 'directus_users',
				schema: {},
			},
			{
				collection,
				field: 'user_updated',
				related_collection: 'directus_users',
				schema: {},
			},
		];

		if (props.fields) {
			relations = relations.filter((relation) => props.fields!.includes(relation.field));
		}

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

		emit('save', collection);
	} catch (error) {
		unexpectedError(error);
	} finally {
		saving.value = false;
		active.value = false;
	}
}
</script>

<template>
	<VDialog v-model="active">
		<VCard>
			<VCardTitle v-if="collection" class="title">
				{{ $t('mcp_prompts_collection.generate_fields_dialog_title') }}
			</VCardTitle>
			<VCardTitle v-else class="title">
				{{ $t('mcp_prompts_collection.generate_collection_dialog_title') }}
			</VCardTitle>
			<VCardText>
				<p v-if="collection">
					{{ $t('mcp_prompts_collection.generate_fields_dialog_description', { collection }) }}
				</p>

				<p v-else>
					{{
						$t('mcp_prompts_collection.generate_collection_dialog_description', { collection: customCollectionName })
					}}
				</p>

				<template v-if="saving">
					<VSkeletonLoader class="loader" />
				</template>

				<template v-else>
					<div v-if="!collection" class="grid">
						<div class="field full">
							<div class="field-label type-label">
								{{ $t('name') }}
								<VIcon v-tooltip="$t('required')" class="required" name="star" sup filled />
							</div>
							<VInput
								v-model="customCollectionName"
								autofocus
								class="monospace"
								:class="{ error: collectionAlreadyExists }"
								db-safe
								:placeholder="$t('a_unique_table_name')"
							/>
							<div class="hints">
								<small v-if="collectionAlreadyExists" class="error">
									{{ $t('mcp_prompts_collection.already_exists') }}
								</small>
								<small class="type-note">{{ $t('collection_names_are_case_sensitive') }}</small>
							</div>
						</div>
					</div>
					<!-- Show fields to be created -->
					<VNotice v-if="fieldsToCreate?.length > 0" class="generated-data" type="warning" multiline>
						<template #title>
							{{ $t('new_data_alert') }}
						</template>
						<span>
							<ul>
								<li v-for="(data, index) in fieldsToCreate" :key="index">
									<span class="field-name">{{ `${data.collection}.${data.field}` }}</span>
								</li>
							</ul>
						</span>
					</VNotice>
				</template>
			</VCardText>
			<VCardActions>
				<VButton secondary @click="active = false">{{ $t('cancel') }}</VButton>
				<VButton
					:loading="saving"
					:disabled="saving || (!collection && collectionAlreadyExists)"
					@click="generateCollection"
				>
					{{ $t('generate') }}
				</VButton>
			</VCardActions>
		</VCard>
	</VDialog>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.grid {
	padding-block-start: 20px;

	@include mixins.form-grid;
}

.hints {
	margin-block-start: 8px;
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.title {
	font-size: 16px;
}

.field-label {
	font-size: 14px;
}

.loader {
	margin-block-start: 24px;
	min-block-size: 150px;
}

.required {
	color: var(--theme--primary);
}

.error {
	color: var(--theme--danger);

	--v-input-border-color: var(--theme--danger);
	--v-input-border-color-hover: var(--theme--danger);
	--v-input-border-color-focus: var(--theme--danger);
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

.type-note {
	position: relative;
	display: block;
	max-inline-size: 520px;
	margin-block-start: 4px;
}
</style>
