<script setup lang="ts">
import type { Preset } from '@directus/types';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';

const props = defineProps<{
	modelValue?: boolean;
	bookmark: Preset;
	saving?: boolean;
}>();

const emit = defineEmits<{
	(e: 'delete'): void;
	(e: 'update:modelValue', value: boolean): void;
}>();

function confirmDelete() {
	if (props.saving) return;
	emit('delete');
}
</script>

<template>
	<VDialog
		:model-value="modelValue"
		persistent
		@update:model-value="$emit('update:modelValue', $event)"
		@esc="$emit('update:modelValue', false)"
		@apply="confirmDelete"
	>
		<template #activator="slotBinding">
			<slot name="activator" v-bind="slotBinding" />
		</template>

		<VCard>
			<VCardTitle>{{ $t('delete_bookmark_copy', { bookmark: bookmark.bookmark ?? '' }) }}</VCardTitle>
			<VCardActions>
				<VButton secondary @click="$emit('update:modelValue', false)">{{ $t('cancel') }}</VButton>
				<VButton :loading="saving" kind="danger" @click="confirmDelete">
					{{ $t('delete_label') }}
				</VButton>
			</VCardActions>
		</VCard>
	</VDialog>
</template>
