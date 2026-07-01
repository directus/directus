<script setup lang="ts">
import type { File } from '@directus/types';
import type { MediaSelection } from '../composables/use-media';
import VDrawer from '@/components/v-drawer.vue';
import VInput from '@/components/v-input.vue';
import VTabItem from '@/components/v-tab-item.vue';
import VTab from '@/components/v-tab.vue';
import VTabsItems from '@/components/v-tabs-items.vue';
import VTabs from '@/components/v-tabs.vue';
import VTextarea from '@/components/v-textarea.vue';
import VUpload from '@/components/v-upload.vue';
import { PrivateViewHeaderBarActionButton } from '@/views/private';

defineProps<{ folder?: string; allowedMimeTypes?: string }>();

const emit = defineEmits<{ select: [file: File]; save: []; cancel: [] }>();

const open = defineModel<boolean>({ required: true });
const selection = defineModel<MediaSelection | null>('mediaSelection', { required: true });
const embed = defineModel<string>('embed', { required: true });
const activeTab = defineModel<string[]>('activeTab', { required: true });
</script>

<template>
	<VDrawer
		v-model="open"
		:title="$t('wysiwyg_options.media')"
		icon="slideshow"
		@cancel="emit('cancel')"
		@apply="emit('save')"
	>
		<template #sidebar>
			<VTabs v-model="activeTab" vertical>
				<VTab value="media">{{ $t('media') }}</VTab>
				<VTab value="embed">{{ $t('embed') }}</VTab>
			</VTabs>
		</template>

		<div class="content">
			<VTabsItems v-model="activeTab">
				<VTabItem value="media">
					<template v-if="selection">
						<video v-if="selection.tag !== 'iframe'" class="media-preview" controls>
							<source :src="selection.previewUrl ?? undefined" />
						</video>
						<iframe
							v-else
							:title="$t('interfaces.input-rich-text-html.media_preview_iframe_title')"
							class="media-preview"
							:src="selection.previewUrl ?? undefined"
						></iframe>
						<div class="grid">
							<div class="field">
								<div class="type-label">{{ $t('source') }}</div>
								<VInput
									:model-value="selection.src ?? undefined"
									@update:model-value="selection.src = $event ?? null"
								/>
							</div>
							<div class="field half">
								<div class="type-label">{{ $t('width') }}</div>
								<VInput
									:model-value="selection.width ?? undefined"
									type="number"
									@update:model-value="selection.width = $event ? Number($event) : null"
								/>
							</div>
							<div class="field half-right">
								<div class="type-label">{{ $t('height') }}</div>
								<VInput
									:model-value="selection.height ?? undefined"
									type="number"
									@update:model-value="selection.height = $event ? Number($event) : null"
								/>
							</div>
						</div>
					</template>
					<VUpload
						v-else
						:multiple="false"
						from-library
						from-url
						:folder="folder"
						:accept="allowedMimeTypes"
						@input="emit('select', $event as File)"
					/>
				</VTabItem>
				<VTabItem value="embed">
					<div class="grid">
						<div class="field">
							<div class="type-label">{{ $t('embed') }}</div>
							<VTextarea v-model="embed" :nullable="false" />
						</div>
					</div>
				</VTabItem>
			</VTabsItems>
		</div>

		<template #actions:primary>
			<PrivateViewHeaderBarActionButton :label="$t('save_media')" icon="check" @click="emit('save')" />
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

.media-preview {
	inline-size: 100%;
	block-size: var(--input-height-md);
	margin-block-end: 1.375rem;
	object-fit: cover;
	border-radius: var(--theme--border-radius);
}
</style>
