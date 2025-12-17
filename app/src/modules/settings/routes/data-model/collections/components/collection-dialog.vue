<script setup lang="ts">
import api from '@/api';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VInput from '@/components/v-input.vue';
import InterfaceList from '@/interfaces/list/list.vue';
import InterfaceSelectColor from '@/interfaces/select-color/select-color.vue';
import InterfaceSelectIcon from '@/interfaces/select-icon/select-icon.vue';
import { useCollectionsStore } from '@/stores/collections';
import { Collection } from '@/types/collections';
import { unexpectedError } from '@/utils/unexpected-error';
import { isEqual } from 'lodash';
import { reactive, ref, watch } from 'vue';

const props = defineProps<{
	modelValue?: boolean;
	collection?: Collection | null;
}>();

const emit = defineEmits(['update:modelValue']);

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
	},
);

const saving = ref(false);

function cancel() {
	emit('update:modelValue', false);
}

async function save() {
	if (!values.collection || saving.value) return;

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
	} catch (error) {
		unexpectedError(error);
	} finally {
		saving.value = false;
	}
}
</script>

<template>
	<VDialog
		:model-value="modelValue"
		persistent
		keep-behind
		@update:model-value="$emit('update:modelValue', $event)"
		@esc="cancel"
		@apply="save"
	>
		<template #activator="slotBinding">
			<slot name="activator" v-bind="slotBinding" />
		</template>

		<VCard>
			<VCardTitle v-if="!collection">{{ $t('create_folder') }}</VCardTitle>
			<VCardTitle v-else>{{ $t('edit_folder') }}</VCardTitle>

			<VCardText>
				<div class="fields">
					<VInput
						v-model="values.collection"
						:disabled="!!collection"
						class="full collection-key"
						db-safe
						autofocus
						:placeholder="$t('folder_key')"
					/>
					<InterfaceSelectIcon width="half" :value="values.icon" @input="values.icon = $event" />
					<InterfaceSelectColor width="half" :value="values.color" @input="values.color = $event" />
					<VInput v-model="values.note" class="full" :placeholder="$t('note')" />
					<InterfaceList
						width="full"
						class="full"
						:value="values.translations"
						:placeholder="$t('no_translations')"
						template="{{ translation }} ({{ language }})"
						:fields="[
							{
								field: 'language',
								name: $t('language'),
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
								name: $t('field_options.directus_collections.collection_name'),
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
			</VCardText>

			<VCardActions>
				<VButton secondary @click="cancel">
					{{ $t('cancel') }}
				</VButton>
				<VButton :disabled="!values.collection" :loading="saving" @click="save">
					{{ $t('save') }}
				</VButton>
			</VCardActions>
		</VCard>
	</VDialog>
</template>

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
	--v-input-font-family: var(--theme--fonts--monospace--font-family);
}
</style>
