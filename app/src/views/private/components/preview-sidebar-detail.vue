<template>
	<sidebar-detail icon="preview" :title="t('live_preview.title')" :badge="Boolean(mode)">
		<div class="fields">
			<div class="field full">
				<p class="type-label">{{ t('live_preview.mode.title') }}</p>
				<v-select v-model="modeWritable" :items="modeChoices"/>
			</div>
			<div class="field full">
				<p class="type-label">{{ t('live_preview.size.title') }}</p>
				<v-select v-model="sizeWritable" :items="sizeChoices" />
			</div>
		</div>
	</sidebar-detail>
</template>

<script setup lang="ts">
import { useSync } from '@directus/shared/composables';
import { useI18n } from 'vue-i18n';

interface Props {
	mode?: string | null;
	size?: string
}

const props = withDefaults(defineProps<Props>(), {
	mode: null,
	size: 'full',
});

const emit = defineEmits(['update:mode', 'update:size', 'reset-url']);

const modeWritable = useSync(props, 'mode', emit);
const sizeWritable = useSync(props, 'size', emit);

const { t } = useI18n();

const modeChoices = [
	{
		text: t('live_preview.mode.none'),
		value: null,
	},
	{
		text: t('live_preview.mode.split'), 
		value: 'split',
	},
	{
		text: t('live_preview.mode.popup'),
		value: 'popup',
	},
]

const sizeChoices = [
	{
		text: t('live_preview.size.responsive'),
		value: 'full',
	},
	{
		text: t('live_preview.size.phone'),
		value: 'phone',
	},
	{
		text: t('live_preview.size.tablet'),
		value: 'tablet',
	},
]
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.fields {
	--form-vertical-gap: 24px;

	@include form-grid;

	.type-label {
		font-size: 1rem;
	}
}

.v-checkbox {
	margin-top: 8px;
}
</style>
