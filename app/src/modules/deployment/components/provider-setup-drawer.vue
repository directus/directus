<script setup lang="ts">
import { createDeployment } from '@directus/sdk';
import { computed, ref, watch } from 'vue';
import { useProviderConfigs } from '../config/providers';
import VDrawer from '@/components/v-drawer.vue';
import VForm from '@/components/v-form/v-form.vue';
import VNotice from '@/components/v-notice.vue';
import { sdk } from '@/sdk';
import { unexpectedError } from '@/utils/unexpected-error';
import { PrivateViewHeaderBarActionButton } from '@/views/private';

const active = defineModel<boolean>('active', { required: true });

const props = defineProps<{
	provider: string;
}>();

const { providerConfigs } = useProviderConfigs();
const providerConfig = computed(() => providerConfigs.value[props.provider]);

const emit = defineEmits<{
	complete: [];
}>();

const credentialsValues = ref<Record<string, any>>({});
const optionsValues = ref<Record<string, any>>({});
const saving = ref(false);

const isValid = computed(() => {
	const fields = providerConfig.value?.credentialsFields || [];

	return fields.every((field) => {
		if (field.meta?.required && field.field) {
			return Boolean(credentialsValues.value[field.field]);
		}

		return true;
	});
});

watch(active, (isActive) => {
	if (!isActive) {
		credentialsValues.value = {};
		optionsValues.value = {};
	}
});

async function save() {
	if (!isValid.value) return;

	saving.value = true;

	try {
		const payload: Record<string, any> = {
			provider: props.provider,
			credentials: credentialsValues.value,
		};

		// Only include options if any are set
		const hasOptions = Object.values(optionsValues.value).some((v) => v !== null && v !== undefined && v !== '');

		if (hasOptions) {
			payload.options = optionsValues.value;
		}

		await sdk.request(createDeployment(payload));

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
		:title="
			$t('deployment.provider.setup_title', { provider: provider ? $t(`deployment.provider.${provider}.name`) : '' })
		"
		persistent
		:icon="props.provider"
		@cancel="onCancel"
	>
		<template #subtitle>
			{{ $t('deployment.deployment') }}
		</template>

		<div class="content">
			<VNotice v-if="providerConfig?.tokenUrl" type="info" class="notice">
				<div>
					{{ $t('deployment.provider.credentials.notice', { provider: $t(`deployment.provider.${provider}.name`) }) }}
				</div>
				<a :href="providerConfig.tokenUrl" target="_blank" rel="noopener noreferrer">
					{{ $t('deployment.provider.credentials.link', { provider: $t(`deployment.provider.${provider}.name`) }) }}
				</a>
			</VNotice>

			<VForm v-model="credentialsValues" :fields="(providerConfig?.credentialsFields as any) || []" autofocus />

			<VForm
				v-if="providerConfig?.optionsFields?.length"
				v-model="optionsValues"
				:fields="(providerConfig?.optionsFields as any) || []"
			/>
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
