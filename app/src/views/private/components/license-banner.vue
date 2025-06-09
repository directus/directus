<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings';
import BannerSVG from '../../../assets/directus-bsl-banner.svg?raw';

const { t } = useI18n();

const settingsStore = useSettingsStore();

async function acceptTerms() {
	await settingsStore.updateSettings({ license_banner_seen: true });
	settingsStore.hydrate();
}
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
						<p>
							{{ t('bsl_banner.license_agreement') }}
							<a href="https://directus.io/bsl">
								{{ t('bsl_banner.directus_bsl') }}
							</a>
							{{ t('bsl_banner.and') }}
							<a href="https://directus.io/privacy">
								{{ t('bsl_banner.privacy_policy') }}
							</a>
						</p>
						<p>{{ t('bsl_banner.directus_free_use') }}</p>
						<p>{{ t('bsl_banner.license_required') }}</p>
					</div>

					<v-card-actions>
						<v-button @click="acceptTerms">
							{{ t('bsl_banner.accept_license') }}
						</v-button>
						<v-button secondary href="https://directus.io/license-request">
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
	padding: 28px;
	width: 80vw;
}

.v-card a {
	color: var(--theme--primary);
	text-decoration: underline;
	font-weight: 600;
}

.v-card .inner {
	display: grid;
	align-items: center;
	gap: 15px;
}

@media (min-width: 900px) {
	.v-card {
		padding: 56px;
		width: initial;
	}

	.v-card .inner {
		grid-template-columns: auto auto;
		width: 750px;
		gap: 30px;
	}

	.left {
		order: -1;
	}
}

.v-card-title {
	padding-left: 0;
	align-items: flex-start;
	font-size: 40px;
	color: var(--theme--primary);
	line-height: 44px;
}

.v-card .left {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
}

.v-card .left .message-copy {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.v-card .left .v-card-actions {
	display: flex;
	flex-direction: row;
	padding-left: 0;
	padding-right: 0;
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
		width: 300px;
	}
}
</style>
