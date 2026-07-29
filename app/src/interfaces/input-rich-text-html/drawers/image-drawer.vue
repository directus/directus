<script setup lang="ts">
import type { File, SettingsStorageAssetPreset } from '@directus/types';
import type { ImageSelection } from '../composables/use-image';
import VCheckbox from '@/components/v-checkbox.vue';
import VDrawer from '@/components/v-drawer.vue';
import VInput from '@/components/v-input.vue';
import VSelect from '@/components/v-select/v-select.vue';
import VUpload from '@/components/v-upload.vue';
import { PrivateViewHeaderBarActionButton } from '@/views/private';

defineProps<{
	storageAssetTransform: string;
	storageAssetPresets: SettingsStorageAssetPreset[];
	folder?: string;
	allowedMimeTypes?: string;
}>();

const emit = defineEmits<{ select: [image: File]; save: []; cancel: [] }>();

const open = defineModel<boolean>({ required: true });
const selection = defineModel<ImageSelection | null>('imageSelection', { required: true });
</script>

<template>
	<VDrawer
		v-model="open"
		:title="$t('wysiwyg_options.image')"
		icon="image"
		@cancel="emit('cancel')"
		@apply="emit('save')"
	>
		<div class="content">
			<template v-if="selection">
				<img class="image-preview" :src="selection.previewUrl" />
				<div class="grid">
					<div class="field half">
						<div class="type-label">{{ $t('image_url') }}</div>
						<VInput v-model="selection.imageUrl" />
					</div>
					<div class="field half-right">
						<div class="type-label">{{ $t('alt_text') }}</div>
						<VInput v-model="selection.alt" :nullable="false" />
					</div>
					<template v-if="storageAssetTransform === 'all'">
						<div class="field half">
							<div class="type-label">{{ $t('width') }}</div>
							<VInput v-model="selection.width" :disabled="!!selection.transformationKey" />
						</div>
						<div class="field half-right">
							<div class="type-label">{{ $t('height') }}</div>
							<VInput v-model="selection.height" :disabled="!!selection.transformationKey" />
						</div>
					</template>
					<div class="field half">
						<div class="type-label">{{ $t('wysiwyg_options.lazy_loading') }}</div>
						<VCheckbox v-model="selection.lazy" block :label="$t('wysiwyg_options.lazy_loading_label')" />
					</div>
					<div v-if="storageAssetTransform !== 'none' && storageAssetPresets.length > 0" class="field half">
						<div class="type-label">{{ $t('transformation_preset_key') }}</div>
						<VSelect
							v-model="selection.transformationKey"
							:items="storageAssetPresets.map((preset) => ({ text: preset.key, value: preset.key }))"
							show-deselect
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
		</div>

		<template #actions:primary>
			<PrivateViewHeaderBarActionButton :label="$t('save_image')" icon="check" @click="emit('save')" />
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

.image-preview {
	inline-size: 100%;
	block-size: var(--input-height-md);
	margin-block-end: 1.375rem;
	object-fit: cover;
	border-radius: var(--theme--border-radius);
}
</style>
