<script setup lang="ts">
import { useRouter } from 'vue-router';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';

defineProps<{
	modelValue: boolean;
	title?: string;
}>();

const emit = defineEmits<{
	'update:modelValue': [value: boolean];
}>();

const router = useRouter();

function close() {
	emit('update:modelValue', false);
}

function manage() {
	close();
	router.push('/settings/license');
}
</script>

<template>
	<VDialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" @esc="close">
		<VCard>
			<VCardTitle>{{ title ?? $t('license.upgrade_to_unlock') }}</VCardTitle>
			<VCardActions>
				<VButton secondary @click="close">{{ $t('cancel') }}</VButton>
				<VButton @click="manage">{{ $t('license.manage_plan') }}</VButton>
			</VCardActions>
		</VCard>
	</VDialog>
</template>
