<script setup lang="ts">
import { createDeployment } from '@directus/sdk';
import { computed, ref, watch } from 'vue';
import { useProviderConfigs } from '../config/providers';
import VBreadcrumb from '@/components/v-breadcrumb.vue';
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

const values = ref<Record<string, any>>({});
const saving = ref(false);

const allFields = computed(() => [
	...(providerConfig.value?.credentialsFields || []),
	...(providerConfig.value?.optionsFields || []),
]);

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
		const payload: Record<string, any> = {
			provider: props.provider,
			credentials: {},
		};

		for (const field of providerConfig.value?.credentialsFields || []) {
			if (field.field && values.value[field.field] !== undefined) {
				payload.credentials[field.field] = values.value[field.field];
			}
		}

		for (const field of providerConfig.value?.optionsFields || []) {
			if (field.field && values.value[field.field] !== undefined && values.value[field.field] !== '') {
				payload.options ??= {};
				payload.options[field.field] = values.value[field.field];
			}
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
			<VBreadcrumb :items="[{ name: $t('deployment.deployment'), disabled: true, to: '' }]" />
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

			<VForm v-model="values" :fields="allFields as any" autofocus />
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
