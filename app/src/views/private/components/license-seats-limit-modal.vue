<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import { useLicenseStore } from '@/stores/license';

defineProps<{
	modelValue: boolean;
	persistent?: boolean;
}>();

const emit = defineEmits<{
	(e: 'update:modelValue', value: boolean): void;
	(e: 'cancel'): void;
}>();

const router = useRouter();
const licenseStore = useLicenseStore();

const isEnterprisePlan = computed(() => licenseStore.info?.plan === 'enterprise');

function close() {
	emit('update:modelValue', false);
	emit('cancel');
}

function handleAction() {
	close();

	if (isEnterprisePlan.value) {
		window.open('https://directus.io/contact', '_blank');
	} else {
		router.push('/settings/license');
	}
}
</script>

<template>
	<VDialog
		:model-value="modelValue"
		:persistent="persistent"
		@update:model-value="$emit('update:modelValue', $event)"
		@esc="close"
	>
		<VCard>
			<VCardTitle>{{ $t('license.reached') }}</VCardTitle>

			<VCardText>
				{{ isEnterprisePlan ? $t('license.contact_sales_body') : $t('license.manage_plan_body') }}
			</VCardText>

			<VCardActions>
				<VButton secondary @click="close">{{ $t('cancel') }}</VButton>
				<VButton @click="handleAction">
					{{ isEnterprisePlan ? $t('license.contact_sales') : $t('license.manage_plan') }}
				</VButton>
			</VCardActions>
		</VCard>
	</VDialog>
</template>
