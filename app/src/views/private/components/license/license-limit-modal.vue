<script setup lang="ts">
import { computed } from 'vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import { useLicenseStore } from '@/stores/license';

const props = defineProps<{
	modelValue: boolean;
	type: 'collections' | 'seats';
	persistent?: boolean;
	onSave?: () => void;
}>();

const emit = defineEmits<{
	(e: 'update:modelValue', value: boolean): void;
	(e: 'cancel'): void;
}>();

const licenseStore = useLicenseStore();

const isEnterprisePlan = computed(() => licenseStore.info?.plan === 'enterprise');

const bodyText = computed(() =>
	isEnterprisePlan.value ? `license.${props.type}_contact_sales_copy` : `license.${props.type}_manage_plan_copy`,
);

function close() {
	emit('update:modelValue', false);
	emit('cancel');
}

function handleManagePlan() {
	emit('update:modelValue', false);

	if (isEnterprisePlan.value) {
		window.open('https://directus.io/contact', '_blank', 'noopener,noreferrer');
	} else {
		window.open('/settings/license', '_blank', 'noopener,noreferrer');
	}
}

function handleSave() {
	emit('update:modelValue', false);
	props.onSave?.();
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
			<VCardTitle>{{ $t('license.limit_reached') }}</VCardTitle>

			<VCardText>{{ $t(bodyText) }}</VCardText>

			<VCardActions>
				<VButton secondary @click="close">{{ $t('cancel') }}</VButton>
				<VButton :secondary="!!onSave" @click="handleManagePlan">
					{{ isEnterprisePlan ? $t('license.contact_sales') : $t('license.manage_plan') }}
				</VButton>
				<VButton v-if="onSave" @click="handleSave">{{ $t('save') }}</VButton>
			</VCardActions>
		</VCard>
	</VDialog>
</template>
