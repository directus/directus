<script setup lang="ts">
import type { Change } from 'diff';
import DiffLines from '../components/diff-lines.vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VNotice from '@/components/v-notice.vue';

defineProps<{ diff: Change[]; undoable: boolean }>();
const emit = defineEmits<{ keep: []; undo: []; raw: [] }>();

const open = defineModel<boolean>({ required: true });
</script>

<template>
	<VDialog v-model="open" @esc="emit('keep')" @apply="emit('keep')">
		<VCard class="paste-warning-dialog">
			<VCardTitle>{{ $t('wysiwyg_options.paste_warning_title') }}</VCardTitle>

			<div class="content">
				<VNotice type="warning" class="notice">
					{{ $t(`wysiwyg_options.${undoable ? 'paste_warning_body' : 'paste_warning_body_kept'}`) }}
				</VNotice>

				<DiffLines class="diff" :diff="diff" />
			</div>

			<VCardActions>
				<template v-if="undoable">
					<VButton secondary @click="emit('undo')">{{ $t('wysiwyg_options.paste_warning_undo') }}</VButton>
					<VButton secondary @click="emit('raw')">{{ $t('wysiwyg_options.paste_warning_paste_raw') }}</VButton>
				</template>
				<VButton @click="emit('keep')">{{ $t('wysiwyg_options.paste_warning_keep') }}</VButton>
			</VCardActions>
		</VCard>
	</VDialog>
</template>

<style lang="scss" scoped>
.paste-warning-dialog {
	--v-card-min-width: auto;

	inline-size: min(52rem, calc(100vw - 7rem));
	max-inline-size: none;
}

.content {
	padding: 0 var(--content-padding);
}

.notice,
.diff {
	margin-block-end: 1rem;
}
</style>
