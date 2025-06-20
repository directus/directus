<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings';
import { useServerStore } from '@/stores/server';
import { storeToRefs } from 'pinia';
import BannerSVG from '../../../assets/directus-bsl-banner.svg?raw';

const { t } = useI18n();

const settingsStore = useSettingsStore();

async function acceptTerms() {
	await settingsStore.updateSettings({ accepted_terms: true });
	settingsStore.hydrate();
}

const { info } = storeToRefs(useServerStore());
</script>

<template>
	<v-dialog>
		<v-card>
			<div class="inner">
				<!-- eslint-disable-next-line vue/no-v-html -->
				<div class="banner-svg" v-html="BannerSVG"></div>

				<div class="left">
					<div class="message-copy">
						<v-card-title>{{ t('bsl_banner.welcome_to_directus') }}</v-card-title>
						<p>{{ t('bsl_banner.directus_free_use') }}</p>
						<p>{{ t('bsl_banner.organization_threshold') }}</p>
						<i18n-t keypath="bsl_banner.license_agreement" tag="p">
							<template #directusBsl>
								<a
									:href="`https://directus.io/bsl?utm_source=self_hosted&utm_medium=product&utm_campaign=2025_06_license_banner&utm_term=${info.version}&utm_content=bsl_1.1_link`"
								>
									{{ t('bsl_banner.directus_bsl') }}
								</a>
							</template>
							<template #privacyPolicy>
								<a
									:href="`https://directus.io/privacy?utm_source=self_hosted&utm_medium=product&utm_campaign=2025_06_license_banner&utm_term=${info.version}&utm_content=privacy_link`"
								>
									{{ t('bsl_banner.privacy_policy') }}
								</a>
							</template>
						</i18n-t>
					</div>

					<v-card-actions>
						<v-button @click="acceptTerms">
							{{ t('bsl_banner.accept_terms') }}
						</v-button>
						<v-button
							secondary
							:href="`https://directus.io/license-request?utm_source=self_hosted&utm_medium=product&utm_campaign=2025_06_license_banner&utm_term=${info.version}&utm_content=get_a_license_button`"
						>
							{{ t('bsl_banner.get_license') }}
							<v-icon name="arrow_outward" small />
						</v-button>
					</v-card-actions>
				</div>
			</div>
		</v-card>
	</v-dialog>
</template>

<style scoped>
.v-card {
	max-width: unset;
	padding: 30px;
	width: 80vw;
}

.v-card a {
	color: var(--theme--primary);
	text-decoration: underline;
	font-weight: 600;
	transition: color var(--fast) var(--transition);

	&:hover {
		color: var(--theme--foreground);
	}
}

.v-card .inner {
	display: grid;
	align-items: center;
}

@media (min-width: 900px) {
	.v-card {
		padding: 56px;
		width: initial;
	}

	.v-card .inner {
		grid-template-columns: 60% 40%;
		width: 706px;
	}

	.left {
		order: -1;
	}
}

.v-card-title {
	padding: 0;
	align-items: flex-start;
	font-size: 28px;
	line-height: 44px;
	font-weight: 700;
}

.v-card .left {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 28px;
	text-wrap: pretty;
}

.v-card .left .message-copy {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	max-width: 435px;
}

.v-card .left .v-card-actions {
	display: flex;
	flex-direction: row;
	padding: 0;
	gap: 12px;
	width: 100%;
}

.banner-svg {
	display: flex;
	justify-content: center;
}

.banner-svg > * {
	width: 200px;
}

@media (min-width: 600px) {
	.v-card .left .v-card-actions {
		gap: unset;
		padding-right: initial;
		width: initial;
	}

	.banner-svg > * {
		width: 257px;
	}

	.v-card .inner {
		gap: 30px;
	}

	.v-card {
		padding: 60px;
		width: fit-content;
	}

	.v-card-title {
		font-size: 32px;
	}
}
</style>
