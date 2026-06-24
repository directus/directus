<script setup lang="ts">
import type { LinkSelection } from '../composables/use-link';
import VButton from '@/components/v-button.vue';
import VCheckbox from '@/components/v-checkbox.vue';
import VDrawer from '@/components/v-drawer.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import { PrivateViewHeaderBarActionButton } from '@/views/private';

defineProps<{ editing: boolean; saveable: boolean }>();

const emit = defineEmits<{ save: []; cancel: []; unlink: [] }>();

const open = defineModel<boolean>({ required: true });
const selection = defineModel<LinkSelection>('linkSelection', { required: true });
</script>

<template>
	<VDrawer
		v-model="open"
		:title="$t('wysiwyg_options.link')"
		icon="link"
		@cancel="emit('cancel')"
		@apply="emit('save')"
	>
		<div class="content">
			<div class="grid">
				<div class="field full">
					<div class="type-label">{{ $t('url') }}</div>
					<VInput
						:model-value="selection.url ?? undefined"
						:placeholder="$t('url_placeholder')"
						autofocus
						@update:model-value="selection.url = $event || null"
					/>
				</div>
				<div class="field full">
					<div class="type-label">{{ $t('display_text') }}</div>
					<VInput
						:model-value="selection.displayText ?? undefined"
						:placeholder="$t('display_text_placeholder')"
						@update:model-value="selection.displayText = $event || null"
					/>
				</div>
				<div class="field half">
					<div class="type-label">{{ $t('tooltip') }}</div>
					<VInput
						:model-value="selection.title ?? undefined"
						:placeholder="$t('tooltip_placeholder')"
						@update:model-value="selection.title = $event || null"
					/>
				</div>
				<div class="field half-right">
					<div class="type-label">{{ $t('open_link_in') }}</div>
					<VCheckbox v-model="selection.newTab" block :label="$t('new_tab')" />
				</div>
			</div>
		</div>

		<template v-if="editing" #actions>
			<VButton v-tooltip.bottom="$t('wysiwyg_options.unlink')" secondary icon rounded @click="emit('unlink')">
				<VIcon name="link_off" />
			</VButton>
		</template>

		<template #actions:primary>
			<PrivateViewHeaderBarActionButton
				:label="$t('save_link')"
				:disabled="!saveable"
				icon="check"
				@click="emit('save')"
			/>
		</template>
	</VDrawer>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.grid {
	@include mixins.form-grid;
}

.content {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding);
}
</style>
