<script setup lang="ts">
import { ref } from 'vue';
import { I18nT, useI18n } from 'vue-i18n';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';

const { t } = useI18n();

const props = withDefaults(
	defineProps<{
		value: string;
	}>(),
	{},
);

const licenseInfo = ref({
	valid: true,
	plan: 'team',
});

const validating = ref(false);
const stored = ref(true);

defineEmits(['input']);
</script>

<template>
	<div class="license-key">
		<VInput
			:model-value="value"
			class="license-input"
			:placeholder="$t('enter_license_key')"
			nullable
			@update:model-value="$emit('input', $event)"
		>
			<template #append>
				<VProgressCircular v-if="validating" class="spinner" small indeterminate />
				<VIcon :name="stored ? 'lock' : 'lock_open'" class="lock-icon" />
			</template>
		</VInput>

		<div v-if="licenseInfo.valid" class="validation-status">
			<span class="status-item">
				<VIcon name="check_circle" class="status-icon" />
				{{ t('license_valid') }}
			</span>

			<span v-if="licenseInfo.plan" class="status-item">
				<VIcon name="check_circle" class="status-icon" />
				{{ licenseInfo.plan }}
			</span>
		</div>

		<I18nT v-else keypath="setup_license_invalid" tag="span">
			<template #contactSupport>
				<a :href="`https://directus.io/license-request`" target="_blank">
					{{ $t('contact_support') }}
				</a>
			</template>
		</I18nT>
	</div>
</template>

<style scoped></style>
