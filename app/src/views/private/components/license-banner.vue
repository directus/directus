<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings';

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
						<v-button secondary href="https://directus.io/bsl">
							{{ t('bsl_banner.get_license') }}
							<v-icon name="arrow_outward" small />
						</v-button>
					</v-card-actions>
				</div>

				<img src="../../../assets/directus-bsl-banner.svg" alt="Directus" class="directus-logo" />
			</div>
		</v-card>
	</v-dialog>
</template>

<style scoped>
.v-card {
	max-width: unset;
	padding: 56px;
}

.v-card a {
	color: var(--theme--primary);
	text-decoration: underline;
	font-weight: 600;
}

.v-card .inner {
	display: grid;
	grid-template-columns: auto auto;
	align-items: center;
	width: 750px;
	height: 448px;
	gap: 30px;
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
}

img {
	justify-self: center;
	width: 300px;
}
</style>
