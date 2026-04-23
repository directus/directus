<script setup lang="ts">
import { setAttr } from '@directus/visual-editing';

interface RichTextProps {
	data: {
		id: string;
		tagline?: string;
		headline?: string;
		content?: string;
		alignment?: 'left' | 'center' | 'right';
		className?: string;
	};
}

const props = withDefaults(defineProps<RichTextProps>(), {
	data: () => ({
		id: '',
		alignment: 'left',
	}),
});
</script>

<template>
	<div
		:class="[
			'mx-auto max-w-[600px] space-y-6',
			{
				'text-center': data.alignment === 'center',
				'text-right': data.alignment === 'right',
				'text-left': data.alignment === 'left',
			},
			props.data.className,
		]"
		:data-directus="
			setAttr({
				collection: 'block_richtext',
				item: data.id,
				fields: ['tagline', 'headline', 'content', 'alignment'],
			})
		"
	>
		<Tagline v-if="data.tagline" :tagline="data.tagline" />
		<Headline v-if="data.headline" :headline="data.headline" />
		<Text v-if="data.content" :content="data.content" />
	</div>
</template>
