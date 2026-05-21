<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { z } from 'zod';
import VButton from '@/components/v-button.vue';
import VCardText from '@/components/v-card-text.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import { useUserStore } from '@/stores/user';

const props = defineProps<{
	/** Whether the dialog is open (v-model) */
	modelValue: boolean;
	/** Blockers reported by the backend for the SSO feature gate */
	blockers?: ('ADMIN_MISSING_EMAIL' | 'ADMIN_MISSING_PASSWORD')[];
}>();

const emit = defineEmits<{
	'update:modelValue': [value: boolean];
	confirm: [value: { email: string; password?: string }];
}>();

const { t } = useI18n();
const userStore = useUserStore();

const needsPassword = computed(() => props.blockers?.includes('ADMIN_MISSING_PASSWORD') ?? false);

const description = computed(() =>
	needsPassword.value
		? t('licensing.resolve_sso_admin_description')
		: t('licensing.resolve_sso_admin_description_email_only'),
);

const admin = reactive<{ email: string; password: string }>({ email: '', password: '' });

// Prefill the email from the current admin each time the dialog opens.
watch(
	() => props.modelValue,
	(open) => {
		if (!open) return;
		const user = userStore.currentUser;
		admin.email = user && !('share' in user) ? (user.email ?? '') : '';
		admin.password = '';
	},
);

const emailValid = computed(() => z.email().safeParse(admin.email).success);

const isValid = computed(() => {
	if (!emailValid.value) return false;
	if (needsPassword.value && !admin.password) return false;
	return true;
});

function confirm() {
	if (!isValid.value) return;

	emit('confirm', {
		email: admin.email,
		...(needsPassword.value ? { password: admin.password } : {}),
	});

	emit('update:modelValue', false);
}

function cancel() {
	emit('update:modelValue', false);
}
</script>

<template>
	<VDialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" @esc="cancel">
		<VCard class="sso-admin-card">
			<header class="title-row">
				<span class="title-text">{{ t('licensing.resolve_sso_admin_title') }}</span>
			</header>

			<VCardText>
				<p class="description">{{ description }}</p>

				<div class="field">
					<label class="field-label">{{ t('licensing.resolve_sso_admin_email') }}</label>
					<VInput v-model="admin.email" type="email" autocomplete="off">
						<template #append>
							<VIcon name="mail" />
						</template>
					</VInput>
				</div>

				<div v-if="needsPassword" class="field">
					<label class="field-label">{{ t('licensing.resolve_sso_admin_password') }}</label>
					<VInput
						v-model="admin.password"
						type="password"
						autocomplete="new-password"
						:placeholder="t('licensing.resolve_sso_admin_password_placeholder')"
					>
						<template #append>
							<VIcon name="lock_open" />
						</template>
					</VInput>
				</div>
			</VCardText>

			<footer class="action-row">
				<VButton secondary @click="cancel">{{ t('cancel') }}</VButton>
				<VButton :disabled="!isValid" @click="confirm">{{ t('licensing.resolve_sso_admin_confirm') }}</VButton>
			</footer>
		</VCard>
	</VDialog>
</template>

<style scoped>
.sso-admin-card {
	--v-card-min-width: 28rem;
}

.sso-admin-card :deep(.v-card-text) {
	padding: 1.25rem 1.75rem;
}

.title-row {
	padding: 1rem 1.75rem;
	border-block-end: 1px solid var(--theme--border-color-subdued);
}

.title-text {
	font-size: 1rem;
	font-weight: 600;
}

.description {
	color: var(--theme--foreground-normal);
	margin-block-end: 1.25rem;
}

.field + .field {
	margin-block-start: 1rem;
}

.field-label {
	display: block;
	margin-block-end: 0.25rem;
	font-weight: 600;
}

.action-row {
	display: flex;
	justify-content: flex-end;
	gap: 0.6875rem;
	padding: 1rem 1.75rem;
	border-block-start: 1px solid var(--theme--border-color-subdued);
}
</style>
