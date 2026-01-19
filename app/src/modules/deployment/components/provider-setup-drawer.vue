<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';
import VDrawer from '@/components/v-drawer.vue';
import VForm from '@/components/v-form/v-form.vue';
import VNotice from '@/components/v-notice.vue';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import type { DeepPartial, Field } from '@directus/types';

const props = defineProps<{
	active: boolean;
	provider: string;
	fields: DeepPartial<Field>[];
	tokenUrl?: string;
}>();

const emit = defineEmits<{
	'update:active': [value: boolean];
	complete: [provider: string];
}>();

const values = ref<Record<string, any>>({});
const saving = ref(false);

const isValid = computed(() => {
	return props.fields.every((field) => {
		if (field.meta?.required && field.field) {
			return Boolean(values.value[field.field]);
		}

		return true;
	});
});

watch(() => props.active, (isActive) => {
	if (!isActive) {
		values.value = {};
	}
});

async function save() {
	if (!isValid.value) return;

	saving.value = true;

	try {
		await api.post(`/deployment`, {
			provider: props.provider,
			credentials: values.value,
		});

		emit('complete', props.provider);
	} catch (error) {
		unexpectedError(error);
	} finally {
		saving.value = false;
	}
}

function onCancel() {
	emit('update:active', false);
}
</script>

<template>
	<VDrawer
		:title="$t('deployment_setup_title', { provider: provider ? $t(`deployment_provider_${provider}`) : '' })"
		:model-value="active"
		persistent
		icon="vercel"
		@cancel="onCancel"
		@update:model-value="$emit('update:active', $event)"
	>
		<template #subtitle>
			{{ $t('deployment') }}
		</template>

		<div class="content">
			<VNotice v-if="tokenUrl" type="info" class="notice">
				{{ $t('deployment_token_notice', { provider: $t(`deployment_provider_${provider}`) }) }}
				<a :href="tokenUrl" target="_blank" rel="noopener noreferrer">
					{{ $t('deployment_token_link', { provider: $t(`deployment_provider_${provider}`) }) }}
				</a>
			</VNotice>

			<VForm v-model="values" :fields="(fields as any)" autofocus />
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

