<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import api from '@/api';
import type { DeepPartial, Field } from '@directus/types';
import { PrivateView } from '@/views/private';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import ProviderSetupDrawer from '../components/provider-setup-drawer.vue';

const router = useRouter();
const { t } = useI18n();

const availableProviders = ['vercel'] as const;
type ProviderType = (typeof availableProviders)[number];

const configuredProviders = ref<Set<string>>(new Set());
const loading = ref(true);
const setupDrawerActive = ref(false);
const selectedProvider = ref<ProviderType | null>(null);

const providerConfig: Record<ProviderType, { fields: DeepPartial<Field>[]; tokenUrl?: string }> = {
	vercel: {
		tokenUrl: 'https://vercel.com/account/tokens',
		fields: [
			{
				field: 'access_token',
				name: t('deployment_token_label'),
				type: 'string',
				meta: {
					interface: 'input',
					width: 'full',
					required: true,
					note: t('deployment_token_hint'),
					options: {
						placeholder: t('deployment_token_placeholder'),
						masked: true,
					},
				},
			},
		],
	},
};

onMounted(async () => {
	await fetchConfiguredProviders();
});

async function fetchConfiguredProviders() {
	loading.value = true;

	const response = await api.get('/deployment', { params: { 'fields[]': 'provider' } });

	for (const provider of response.data.data) {
		configuredProviders.value.add(provider.provider);
	}

	loading.value = false;
}

function isConfigured(type: string) {
	return configuredProviders.value.has(type);
}

function onProviderClick(type: ProviderType) {
	if (isConfigured(type)) {
		router.push(`/deployment/${type}`);
	} else {
		selectedProvider.value = type;
		setupDrawerActive.value = true;
	}
}

function onSetupComplete(type: string) {
	setupDrawerActive.value = false;
	configuredProviders.value.add(type);
	router.push(`/deployment/${type}`);
}
</script>

<template>
	<PrivateView :title="$t('deployment_overview')" icon="rocket_launch">
		<template #headline>
			{{ $t('deployment') }}
		</template>

		<div class="content">
			<h2 class="section-title type-label">
				<VIcon name="settings" />
				{{ $t('deployment_providers') }}
			</h2>

				<VListItem
					v-for="provider in availableProviders"
					:key="provider"
					clickable
					@click="onProviderClick(provider)"
				>
					<VListItemIcon><VIcon :name="provider" /></VListItemIcon>
					<VListItemContent>
						{{ $t(`deployment_provider_${provider}`) }}
						<template #subtitle>
							{{ $t('deployment_provider_description', { provider: $t(`deployment_provider_${provider}`) }) }}
						</template>
					</VListItemContent>
				</VListItem>
		</div>

		<ProviderSetupDrawer
			v-if="selectedProvider"
			v-model:active="setupDrawerActive"
			:provider="selectedProvider"
			:fields="providerConfig[selectedProvider].fields"
			:token-url="providerConfig[selectedProvider].tokenUrl"
			@complete="onSetupComplete"
		/>
	</PrivateView>
</template>

<style scoped lang="scss">
.content {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
}

.section-title {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-block-end: 12px;
}
</style>
