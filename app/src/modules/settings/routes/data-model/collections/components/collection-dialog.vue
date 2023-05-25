<template>
	<v-dialog :model-value="modelValue" persistent @update:model-value="$emit('update:modelValue', $event)" @esc="cancel">
		<template #activator="slotBinding">
			<slot name="activator" v-bind="slotBinding" />
		</template>

		<v-card>
			<v-card-title v-if="!collection">{{ t('create_folder') }}</v-card-title>
			<v-card-title v-else>{{ t('edit_folder') }}</v-card-title>

			<v-card-text>
				<div class="fields">
					<v-input
						v-model="values.collection"
						:disabled="!!collection"
						class="full collection-key"
						db-safe
						autofocus
						:placeholder="t('folder_key')"
					/>
					<interface-select-icon width="half" :value="values.icon" @input="values.icon = $event" />
					<interface-select-color width="half" :value="values.color" @input="values.color = $event" />
					<v-input v-model="values.note" class="full" :placeholder="t('note')" />
					<interface-list
						width="full"
						class="full"
						:value="values.translations"
						:placeholder="t('no_translations')"
						template="{{ translation }} ({{ language }})"
						:fields="[
							{
								field: 'language',
								name: t('language'),
								type: 'string',
								schema: {
									default_value: 'en-US',
								},
								meta: {
									interface: 'system-language',
									width: 'half',
								},
							},
							{
								field: 'translation',
								name: t('field_options.directus_collections.collection_name'),
								type: 'string',
								meta: {
									interface: 'input',
									width: 'half',
									options: {
										placeholder: '$t:field_options.directus_collections.translation_placeholder',
									},
								},
							},
						]"
						@input="values.translations = $event"
					/>
				</div>
			</v-card-text>

			<v-card-actions>
				<v-button secondary @click="cancel">
					{{ t('cancel') }}
				</v-button>
				<v-button :disabled="!values.collection" :loading="saving" @click="save">
					{{ t('save') }}
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script setup lang="ts">
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';
import { ref, reactive, watch } from 'vue';
import { useCollectionsStore } from '@/stores/collections';
import { useI18n } from 'vue-i18n';
import { isEqual } from 'lodash';
import { Collection } from '@/types/collections';

const props = defineProps<{
	modelValue?: boolean;
	collection?: Collection;
}>();

const emit = defineEmits(['update:modelValue']);

const { t } = useI18n();

const collectionsStore = useCollectionsStore();

const values = reactive({
	collection: props.collection?.collection ?? null,
	icon: props.collection?.icon ?? 'folder',
	note: props.collection?.meta?.note ?? null,
	color: props.collection?.color ?? null,
	translations: props.collection?.meta?.translations ?? null,
});

watch(
	() => props.modelValue,
	(newValue, oldValue) => {
		if (isEqual(newValue, oldValue) === false) {
			values.collection = props.collection?.collection ?? null;
			values.icon = props.collection?.icon ?? 'folder';
			values.note = props.collection?.meta?.note ?? null;
			values.color = props.collection?.color ?? null;
			values.translations = props.collection?.meta?.translations ?? null;
		}
	}
);

const saving = ref(false);

function cancel() {
	emit('update:modelValue', false);
}

async function save() {
	saving.value = true;

	try {
		if (props.collection) {
			await api.patch(`/collections/${props.collection.collection}`, { meta: values });
			await collectionsStore.hydrate();
		} else {
			await api.post<any>('/collections', { collection: values.collection, meta: values });
			await collectionsStore.hydrate();
		}

		emit('update:modelValue', false);
	} catch (err) {
		unexpectedError(err);
	} finally {
		saving.value = false;
	}
}
</script>

<style scoped>
.fields {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 12px;
}

.full {
	grid-column: 1 / span 2;
}

.collection-key {
	--v-input-font-family: var(--family-monospace);
}
</style>
