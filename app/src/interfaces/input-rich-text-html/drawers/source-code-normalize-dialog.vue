<script setup lang="ts">
import type { Change } from 'diff';
import DiffLines from '../components/diff-lines.vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VNotice from '@/components/v-notice.vue';

defineProps<{ diff: Change[] }>();
const emit = defineEmits<{ confirm: []; cancel: [] }>();

const open = defineModel<boolean>({ required: true });
</script>

<template>
	<VDialog v-model="open" @esc="emit('cancel')" @apply="emit('confirm')">
		<VCard class="normalize-dialog">
			<VCardTitle>{{ $t('wysiwyg_options.source_code_normalize_title') }}</VCardTitle>

			<div class="content">
				<VNotice type="warning" class="notice">{{ $t('wysiwyg_options.source_code_normalize_body') }}</VNotice>

				<DiffLines :diff="diff" />
			</div>

			<VCardActions>
				<VButton secondary @click="emit('cancel')">{{ $t('cancel') }}</VButton>
				<VButton kind="warning" @click="emit('confirm')">{{ $t('wysiwyg_options.save_anyway') }}</VButton>
			</VCardActions>
		</VCard>
	</VDialog>
</template>

<style lang="scss" scoped>
.normalize-dialog {
	--v-card-min-width: auto;

	inline-size: min(52rem, calc(100vw - 7rem));
	max-inline-size: none;
}

.content {
	padding: 0 var(--content-padding);
}

.notice {
	margin-block-end: 1rem;
}
</style>
