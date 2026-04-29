<script setup lang="ts">
import { useRouter } from 'vue-router';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';

const props = defineProps<{
	modelValue: boolean;
	variant: 'manage-plan' | 'contact-sales';
}>();

const emit = defineEmits<{
	(e: 'update:modelValue', value: boolean): void;
	(e: 'cancel'): void;
}>();

const router = useRouter();

function close() {
	emit('update:modelValue', false);
	emit('cancel');
}

function handleAction() {
	close();

	if (props.variant === 'manage-plan') {
		router.push('/settings/license');
	} else {
		window.open('https://directus.io/contact', '_blank');
	}
}
</script>

<template>
	<VDialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" @esc="close">
		<VCard>
			<VCardTitle>{{ $t('license.reached') }}</VCardTitle>

			<VCardText>
				{{ variant === 'manage-plan' ? $t('license.manage_plan_body') : $t('license.contact_sales_body') }}
			</VCardText>

			<VCardActions>
				<VButton secondary @click="close">{{ $t('cancel') }}</VButton>
				<VButton @click="handleAction">
					{{ variant === 'manage-plan' ? $t('license.manage_plan') : $t('license.contact_sales') }}
				</VButton>
			</VCardActions>
		</VCard>
	</VDialog>
</template>
