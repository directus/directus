<script setup lang="ts">
import { nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3';
import { computed } from 'vue';
import type { MediaAttrs } from './media';

const props = defineProps(nodeViewProps);

const attrs = computed(() => props.node.attrs as MediaAttrs);

// Selecting the node then invoking the host opener drives the edit-existing flow.
function edit() {
	if (typeof props.getPos === 'function') {
		const pos = props.getPos();
		if (pos !== undefined) props.editor.commands.setNodeSelection(pos);
	}

	// storage is untyped; cast to access the media bucket set by the host editor
	(props.editor.storage as Record<string, any>).media?.onOpenDrawer?.();
}
</script>

<template>
	<NodeViewWrapper as="div" class="media-node" :class="{ selected }" @dblclick="edit">
		<video v-if="attrs.tag === 'video'" :src="attrs.src ?? undefined" controls />
		<audio v-else-if="attrs.tag === 'audio'" :src="attrs.src ?? undefined" controls />
		<!-- iframe preview is non-interactive so clicks reach the node wrapper for selection/edit -->
		<iframe v-else class="media-iframe" :src="attrs.src ?? undefined" tabindex="-1"></iframe>
	</NodeViewWrapper>
</template>

<style lang="scss" scoped>
.media-node {
	display: inline-block;
	max-inline-size: 100%;

	&.selected {
		outline: 2px solid var(--theme--primary);
	}

	video,
	audio,
	.media-iframe {
		max-inline-size: 100%;
	}

	.media-iframe {
		pointer-events: none;
	}
}
</style>
