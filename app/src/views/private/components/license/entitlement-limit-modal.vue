<script setup lang="ts">
import { type CountableEntitlementKey } from '@directus/license';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VIcon from '@/components/v-icon/v-icon.vue';

const props = defineProps<{
	modelValue: boolean;
	entitlementKey: CountableEntitlementKey;
	isAdmin?: boolean;
	onSave?: () => void;
}>();

const emit = defineEmits<{
	(e: 'update:modelValue', value: boolean): void;
	(e: 'cancel'): void;
}>();

const router = useRouter();

const titleKey = computed(() => `license.${props.entitlementKey}_limit.title`);

const bodyKey = computed(() => {
	if (props.entitlementKey === 'seats') {
		return props.isAdmin ? 'license.seats_limit.body_admin' : 'license.seats_limit.body_member';
	}

	if (props.entitlementKey === 'flows') return 'license.flows_limit.body';

	// Collections are always admin-facing; no member variant needed.
	return 'license.collections_limit.body';
});

function close() {
	emit('update:modelValue', false);
	emit('cancel');
}

function handleManagePlan() {
	emit('update:modelValue', false);
	window.open(router.resolve({ name: 'settings-license' }).href, '_blank', 'noopener,noreferrer');
}

function handleSave() {
	emit('update:modelValue', false);
	props.onSave?.();
}
</script>

<template>
	<VDialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" @esc="close">
		<VCard>
			<VCardTitle>{{ $t(titleKey) }}</VCardTitle>

			<VCardText>{{ $t(bodyKey) }}</VCardText>

			<VCardActions>
				<VButton secondary @click="close">{{ $t('cancel') }}</VButton>
				<VButton v-if="isAdmin" :secondary="!!onSave" @click="handleManagePlan">
					{{ $t('license.manage_plan') }}
					<VIcon name="open_in_new" right />
				</VButton>
				<VButton v-if="onSave" @click="handleSave">{{ $t('save') }}</VButton>
			</VCardActions>
		</VCard>
	</VDialog>
</template>
