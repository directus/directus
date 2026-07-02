<script setup lang="ts">
import VDrawer from '@/components/v-drawer.vue';
import VNotice from '@/components/v-notice.vue';
import InterfaceInputCode from '@/interfaces/input-code/input-code.vue';
import { PrivateViewHeaderBarActionButton } from '@/views/private';

const emit = defineEmits<{ save: []; cancel: [] }>();

const open = defineModel<boolean>({ required: true });
const code = defineModel<string>('code', { required: true });
</script>

<template>
	<VDrawer
		v-model="open"
		:title="$t('wysiwyg_options.source_code')"
		icon="html"
		@cancel="emit('cancel')"
		@apply="emit('save')"
	>
		<div class="content">
			<VNotice type="info" class="notice">{{ $t('wysiwyg_options.source_code_normalization_notice') }}</VNotice>
			<InterfaceInputCode :value="code" language="htmlmixed" :line-number="false" @input="code = $event" />
		</div>

		<template #actions:primary>
			<PrivateViewHeaderBarActionButton :label="$t('save')" icon="check" @click="emit('save')" />
		</template>
	</VDrawer>
</template>

<style lang="scss" scoped>
.content {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding);
}

.notice {
	margin-block-end: 1.375rem;
}
</style>
