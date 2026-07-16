<script setup lang="ts">
import type { Change } from 'diff';
import DiffLines from '../components/diff-lines.vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VCheckbox from '@/components/v-checkbox.vue';
import VDetail from '@/components/v-detail.vue';
import VDialog from '@/components/v-dialog.vue';
import VNotice from '@/components/v-notice.vue';

defineProps<{ diff: Change[] }>();
const emit = defineEmits<{ confirm: []; cancel: [] }>();

const open = defineModel<boolean>({ required: true });
const dontShowAgain = defineModel<boolean>('dontShowAgain', { required: true });
</script>

<template>
	<VDialog v-model="open" @esc="emit('cancel')" @apply="emit('confirm')">
		<VCard class="normalization-warning-dialog">
			<VCardTitle>{{ $t('wysiwyg_options.normalization_warning_title') }}</VCardTitle>

			<div class="content">
				<VNotice type="warning" class="notice">{{ $t('wysiwyg_options.normalization_warning_body') }}</VNotice>

				<VDetail class="detail" :label="$t('wysiwyg_options.normalization_warning_view_changes')">
					<DiffLines :diff="diff" />
				</VDetail>

				<VCheckbox v-model="dontShowAgain" :label="$t('wysiwyg_options.normalization_warning_dont_show_again')" />
			</div>

			<VCardActions>
				<VButton secondary @click="emit('cancel')">{{ $t('cancel') }}</VButton>
				<VButton @click="emit('confirm')">{{ $t('continue') }}</VButton>
			</VCardActions>
		</VCard>
	</VDialog>
</template>

<style lang="scss" scoped>
.normalization-warning-dialog {
	--v-card-min-width: auto;

	inline-size: min(52rem, calc(100vw - 7rem));
	max-inline-size: none;
}

.content {
	padding: 0 var(--content-padding);
}

.notice,
.detail {
	margin-block-end: 1rem;
}
</style>
