<script setup lang="ts">
import { KEY } from '@directus/license';
import { useCookies } from '@vueuse/integrations/useCookies';
import { computed, ref } from 'vue';
import { I18nT, useI18n } from 'vue-i18n';
import api from '@/api';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import SystemLicenseKey from '@/interfaces/_system/system-license-key/system-license-key.vue';
import { useServerStore } from '@/stores/server';
import { notify } from '@/utils/notify';

const model = defineModel<boolean>();

const cookies = useCookies(['license-onboarding-dismissed']);
const { t } = useI18n();
const serverStore = useServerStore();

const licenseKey = ref<string | null>(null);
const isSaving = ref(false);

const isKeyValid = computed(
	() => !!licenseKey.value && licenseKey.value.length >= 29 && KEY.safeParse(licenseKey.value).success,
);

async function save() {
	isSaving.value = true;

	try {
		await api.patch('/settings', { license_key: licenseKey.value });
		await serverStore.hydrate();
		model.value = false;
	} finally {
		isSaving.value = false;
	}
}

function dismiss() {
	cookies.set('license-onboarding-dismissed', 'true', { expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) });
	notify({ title: t('remind_next_login'), type: 'info' });
	model.value = false;
}
</script>

<template>
	<VDialog v-model="model">
		<VCard>
			<div class="inner">
				<VCardTitle>{{ $t('license_onboarding_title') }}</VCardTitle>
				<VCardText>
					<I18nT keypath="license_onboarding_desc" tag="p">
						<template #oig>
							<a href="https://directus.io/license-request" target="_blank">{{ $t('open_innovation_grant') }}</a>
						</template>
					</I18nT>
					<label class="license-label">
						{{ $t('license_key') }}
						<span class="optional">({{ $t('optional') }})</span>
					</label>
					<SystemLicenseKey :value="licenseKey" @input="licenseKey = $event" />
				</VCardText>
				<VCardActions>
					<VButton secondary>{{ $t('get_license_key') }}</VButton>
					<VButton v-if="isKeyValid" :loading="isSaving" @click="save">{{ $t('setup_launch') }}</VButton>
					<VButton v-else secondary @click="dismiss">{{ $t('skip') }}</VButton>
				</VCardActions>
			</div>
		</VCard>
	</VDialog>
</template>

<style scoped>
.v-card {
	max-inline-size: unset;
	inline-size: 30.375rem;
}

p {
	font-size: 0.875rem;
	line-height: 1.5;
	margin-block-end: 1.25rem;

	a {
		color: var(--theme--primary);
		text-decoration: underline;
	}
}

.license-label {
	display: block;
	font-size: 0.875rem;
	font-weight: 600;
	margin-block-end: 0.5rem;

	.optional {
		font-weight: 400;
		color: var(--theme--primary);
	}
}
</style>
