<script setup lang="ts">
import { ref, toRefs } from 'vue';
import { useRouter } from 'vue-router';
import SettingsNavigation from '../../components/navigation.vue';
import api from '@/api';
import VBreadcrumb from '@/components/v-breadcrumb.vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VForm from '@/components/v-form/v-form.vue';
import { useItem } from '@/composables/use-item';
import { unexpectedError } from '@/utils/unexpected-error';
import { PrivateView } from '@/views/private';

const props = defineProps<{
	primaryKey: string;
}>();

const router = useRouter();
const { primaryKey } = toRefs(props);

const { item, loading } = useItem(ref('directus_oauth_clients'), primaryKey);

const confirmRevoke = ref(false);
const revoking = ref(false);

async function revokeClient() {
	revoking.value = true;

	try {
		await api.delete(`/mcp-oauth/clients/${props.primaryKey}`);
		router.push('/settings/mcp-oauth-clients');
	} catch (error) {
		unexpectedError(error);
	} finally {
		revoking.value = false;
		confirmRevoke.value = false;
	}
}
</script>

<template>
	<PrivateView :title="item?.client_name ?? '...'" icon="key" show-back back-to="/settings/mcp-oauth-clients">
		<template #headline>
			<VBreadcrumb
				:items="[
					{ name: $t('settings'), to: '/settings' },
					{ name: $t('settings_ai'), to: '/settings/ai' },
					{ name: $t('mcp_oauth_clients'), to: '/settings/mcp-oauth-clients' },
				]"
			/>
		</template>

		<template #actions>
			<VButton v-tooltip.bottom="$t('revoke_client')" kind="danger" secondary icon @click="confirmRevoke = true">
				<VIcon name="delete" />
			</VButton>
		</template>

		<template #navigation>
			<SettingsNavigation />
		</template>

		<div class="content">
			<VForm
				:loading="loading"
				:initial-values="item"
				:fields="undefined"
				:primary-key="primaryKey"
				collection="directus_oauth_clients"
				disabled
			/>
		</div>

		<VDialog v-model="confirmRevoke" @esc="confirmRevoke = false">
			<VCard>
				<VCardTitle>{{ $t('revoke_client') }}</VCardTitle>
				<VCardText>{{ $t('revoke_client_confirm') }}</VCardText>
				<VCardActions>
					<VButton secondary @click="confirmRevoke = false">{{ $t('cancel') }}</VButton>
					<VButton kind="danger" :loading="revoking" @click="revokeClient">{{ $t('revoke_client') }}</VButton>
				</VCardActions>
			</VCard>
		</VDialog>
	</PrivateView>
</template>

<style lang="scss" scoped>
.content {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
}
</style>
