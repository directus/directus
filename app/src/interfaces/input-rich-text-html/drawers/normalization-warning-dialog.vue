<script setup lang="ts">
import type { Change } from 'diff';
import DiffLines from '../components/diff-lines.vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDetail from '@/components/v-detail.vue';
import VDialog from '@/components/v-dialog.vue';
import VNotice from '@/components/v-notice.vue';

defineProps<{ diff: Change[] }>();
const emit = defineEmits<{ confirm: []; cancel: []; raw: [] }>();

const open = defineModel<boolean>({ required: true });
</script>

<template>
	<VDialog v-model="open" @esc="emit('cancel')" @apply="emit('raw')">
		<VCard class="normalization-warning-dialog">
			<VCardTitle>{{ $t('wysiwyg_options.normalization_warning_title') }}</VCardTitle>

			<div class="content">
				<VNotice type="warning" class="notice">{{ $t('wysiwyg_options.normalization_warning_body') }}</VNotice>

				<VDetail class="detail" :label="$t('wysiwyg_options.normalization_warning_view_changes')">
					<DiffLines :diff="diff" />
				</VDetail>
			</div>

			<VCardActions>
				<VButton secondary @click="emit('cancel')">
					{{ $t('wysiwyg_options.normalization_warning_keep_readonly') }}
				</VButton>
				<VButton secondary @click="emit('confirm')">
					{{ $t('wysiwyg_options.normalization_warning_edit_anyway') }}
				</VButton>
				<VButton @click="emit('raw')">{{ $t('wysiwyg_options.normalization_warning_edit_raw') }}</VButton>
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
