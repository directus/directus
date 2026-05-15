<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import VCheckbox from '@/components/v-checkbox.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VNotice from '@/components/v-notice.vue';

const props = defineProps<{
	/** Blockers reported by the backend that prevent SSO deactivation */
	blockers?: ('ADMIN_MISSING_EMAIL' | 'ADMIN_MISSING_PASSWORD')[];
	/** Whether the user has confirmed SSO deactivation (v-model) */
	modelValue: boolean;
}>();

const emit = defineEmits<{
	'update:modelValue': [value: boolean];
	'update:admin': [value: { email?: string; password?: string }];
}>();

const { t } = useI18n();

const hasEmailBlocker = computed(() => props.blockers?.includes('ADMIN_MISSING_EMAIL') ?? false);
const hasPasswordBlocker = computed(() => props.blockers?.includes('ADMIN_MISSING_PASSWORD') ?? false);
const hasBlockers = computed(() => hasEmailBlocker.value || hasPasswordBlocker.value);

const admin = reactive<{ email: string; password: string }>({ email: '', password: '' });

watch(admin, () => {
	emit('update:admin', {
		...(hasEmailBlocker.value ? { email: admin.email } : {}),
		...(hasPasswordBlocker.value ? { password: admin.password } : {}),
	});
});

const isValid = computed(() => {
	if (!props.modelValue) return false;
	if (hasEmailBlocker.value && !admin.email) return false;
	if (hasPasswordBlocker.value && !admin.password) return false;
	return true;
});

defineExpose({ isValid });
</script>

<template>
	<section class="resolution-sso-section">
		<header class="section-header">
			<span class="section-title">
				<VIcon name="key" small />
				{{ t('licensing.resolve_section_sso') }}
			</span>
		</header>

		<button
			type="button"
			class="confirm"
			:class="{ selected: modelValue }"
			@click="emit('update:modelValue', !modelValue)"
		>
			<VCheckbox :checked="modelValue" />
			<span>{{ t('licensing.resolve_sso_confirm') }}</span>
		</button>

		<p class="caption">{{ t('licensing.resolve_sso_caption') }}</p>

		<template v-if="modelValue && hasBlockers">
			<VNotice type="warning" class="blocker-notice">
				{{ t('licensing.resolve_sso_blocker_notice') }}
			</VNotice>

			<div class="admin-fields">
				<div v-if="hasEmailBlocker" class="field">
					<label class="field-label">{{ t('licensing.resolve_sso_admin_email') }}</label>
					<VInput v-model="admin.email" type="email" autocomplete="off" />
				</div>
				<div v-if="hasPasswordBlocker" class="field">
					<label class="field-label">{{ t('licensing.resolve_sso_admin_password') }}</label>
					<VInput v-model="admin.password" type="password" autocomplete="new-password" />
				</div>
			</div>
		</template>
	</section>
</template>

<style scoped>
.resolution-sso-section {
	margin-block-start: 2rem;
}

.section-header {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-block-end: 0.75rem;
	padding-block-end: 0.75rem;
	border-block-end: 1px solid var(--theme--border-color-subdued);
}

.section-title {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 1.125rem;
	font-weight: 600;
	color: var(--theme--foreground-accent);
}

.confirm {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	width: 100%;
	padding: 0.5rem 0.75rem;
	border: 1px solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
	background: var(--theme--form--field--input--background);
	color: var(--theme--foreground);
	font: inherit;
	text-align: start;
	cursor: pointer;
	transition: border-color var(--fast) var(--transition);
}

.confirm:hover {
	border-color: var(--theme--form--field--input--border-color-hover);
}

.confirm.selected {
	border-color: var(--theme--primary);
}

.caption {
	color: var(--theme--foreground-subdued);
	margin-block-start: 0.5rem;
	font-size: 0.8125rem;
	line-height: 1.4;
}

.blocker-notice {
	margin-block-start: 0.75rem;
}

.admin-fields {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 0.75rem;
	margin-block-start: 0.75rem;
}

@media (max-width: 600px) {
	.admin-fields {
		grid-template-columns: 1fr;
	}
}

.field-label {
	display: block;
	margin-block-end: 0.25rem;
	color: var(--theme--foreground-subdued);
	font-size: 0.8125rem;
}
</style>
