<script setup lang="ts">
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
import { isEqual } from 'lodash';
import { reactive, watch } from 'vue';

export interface GroupDialogItem {
	id?: string;
	name?: string | null;
	icon?: string | null;
	color?: string | null;
	description?: string | null;
	translations?: Record<string, string>[] | null;
}

export interface GroupDialogValues {
	name: string | null;
	icon: string;
	color: string | null;
	description: string | null;
	translations: Record<string, string>[] | null;
}

const props = withDefaults(
	defineProps<{
		/** v-model for dialog visibility */
		modelValue?: boolean;
		/** Existing item to edit (null for create) */
		item?: GroupDialogItem | null;
		/** Translation key for create title */
		createTitleKey?: string;
		/** Translation key for edit title */
		editTitleKey?: string;
		/** Translation key for name placeholder */
		namePlaceholderKey?: string;
		/** Default icon for new items */
		defaultIcon?: string;
		/** Show translations field */
		showTranslations?: boolean;
		/** Show description field */
		showDescription?: boolean;
		/** Whether saving is in progress */
		saving?: boolean;
		/** Disable name editing for existing items */
		disableNameEdit?: boolean;
	}>(),
	{
		modelValue: false,
		item: null,
		createTitleKey: 'create_folder',
		editTitleKey: 'edit_folder',
		namePlaceholderKey: 'folder_key',
		defaultIcon: 'folder',
		showTranslations: false,
		showDescription: true,
		saving: false,
		disableNameEdit: true,
	},
);

const emit = defineEmits<{
	'update:modelValue': [value: boolean];
	save: [values: GroupDialogValues, isEdit: boolean];
}>();

const values = reactive<GroupDialogValues>({
	name: props.item?.name ?? null,
	icon: props.item?.icon ?? props.defaultIcon,
	color: props.item?.color ?? null,
	description: props.item?.description ?? null,
	translations: props.item?.translations ?? null,
});

watch(
	() => props.modelValue,
	(newValue, oldValue) => {
		if (isEqual(newValue, oldValue) === false) {
			values.name = props.item?.name ?? null;
			values.icon = props.item?.icon ?? props.defaultIcon;
			values.color = props.item?.color ?? null;
			values.description = props.item?.description ?? null;
			values.translations = props.item?.translations ?? null;
		}
	},
);

function cancel() {
	emit('update:modelValue', false);
}

function save() {
	if (!values.name || props.saving) return;

	emit('save', { ...values }, !!props.item);
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
			<VCardTitle v-if="!item">{{ $t(createTitleKey) }}</VCardTitle>
			<VCardTitle v-else>{{ $t(editTitleKey) }}</VCardTitle>

			<VCardText>
				<div class="fields">
					<VInput
						:model-value="values.name ?? undefined"
						:disabled="!!item && disableNameEdit"
						class="full name-input"
						db-safe
						autofocus
						:placeholder="$t(namePlaceholderKey)"
						@update:model-value="values.name = $event ?? null"
					/>
					<InterfaceSelectIcon width="half" :value="values.icon" @input="values.icon = $event ?? defaultIcon" />
					<InterfaceSelectColor width="half" :value="values.color ?? undefined" @input="values.color = $event ?? null" />
					<VInput
						v-if="showDescription"
						:model-value="values.description ?? undefined"
						class="full"
						:placeholder="$t('note')"
						@update:model-value="values.description = $event ?? null"
					/>
					<InterfaceList
						v-if="showTranslations"
						width="full"
						class="full"
						:value="(values.translations as any)"
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
								name: $t('translation'),
								type: 'string',
								meta: {
									interface: 'input',
									width: 'half',
								},
							},
						]"
						@input="values.translations = $event as any"
					/>
				</div>
			</VCardText>

			<VCardActions>
				<VButton secondary @click="cancel">
					{{ $t('cancel') }}
				</VButton>
				<VButton :disabled="!values.name" :loading="saving" @click="save">
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

.name-input {
	--v-input-font-family: var(--theme--fonts--monospace--font-family);
}
</style>
