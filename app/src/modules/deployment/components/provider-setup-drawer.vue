<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { sdk } from '@/sdk';
import { createDeployment } from '@directus/sdk';
import { unexpectedError } from '@/utils/unexpected-error';
import VDrawer from '@/components/v-drawer.vue';
import VForm from '@/components/v-form/v-form.vue';
import VNotice from '@/components/v-notice.vue';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import { useProviderConfigs } from '../config/provider-fields';

const active = defineModel<boolean>('active', { required: true });

const props = defineProps<{
	provider: string;
}>();

const { providerConfigs } = useProviderConfigs();
const providerConfig = computed(() => providerConfigs[props.provider]);

const emit = defineEmits<{
	complete: [];
}>();

const values = ref<Record<string, any>>({});
const saving = ref(false);

const isValid = computed(() => {
	const fields = providerConfig.value?.credentialsFields || [];

	return fields.every((field) => {
		if (field.meta?.required && field.field) {
			return Boolean(values.value[field.field]);
		}

		return true;
	});
});

watch(active, (isActive) => {
	if (!isActive) {
		values.value = {};
	}
});

async function save() {
	if (!isValid.value) return;

	saving.value = true;

	try {
		await sdk.request(
			createDeployment({
				provider: props.provider,
				credentials: values.value,
			}),
		);

		emit('complete');
	} catch (error) {
		unexpectedError(error);
	} finally {
		saving.value = false;
	}
}

function onCancel() {
	active.value = false;
}
</script>

<template>
	<VDrawer
		v-model="active"
		:title="$t('deployment_provider_setup_title', { provider: provider ? $t(`deployment_provider_${provider}`) : '' })"
		persistent
		icon="vercel"
		@cancel="onCancel"
	>
		<template #subtitle>
			{{ $t('deployment') }}
		</template>

		<div class="content">
			<VNotice v-if="providerConfig?.tokenUrl" type="info" class="notice">
				<div>
					{{ $t('deployment_provider_credentials_notice', { provider: $t(`deployment_provider_${provider}`) }) }}
				</div>
				<a :href="providerConfig.tokenUrl" target="_blank" rel="noopener noreferrer">
					{{ $t('deployment_provider_credentials_link', { provider: $t(`deployment_provider_${provider}`) }) }}
				</a>
			</VNotice>

			<VForm v-model="values" :fields="(providerConfig?.credentialsFields as any) || []" autofocus />
		</div>

		<template #actions>
			<PrivateViewHeaderBarActionButton
				v-tooltip.bottom="$t('save')"
				:disabled="!isValid"
				:loading="saving"
				icon="check"
				@click="save"
			/>
		</template>
	</VDrawer>
</template>

<style lang="scss" scoped>
.content {
	padding: var(--content-padding);
}

.notice {
	margin-block-end: 24px;

	a {
		color: var(--theme--primary);
	}
}
</style>
