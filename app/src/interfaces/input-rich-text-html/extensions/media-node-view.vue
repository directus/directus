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
	<!-- draggable + data-drag-handle let tiptap run its node-view drag flow; without them the
	browser copy-drops the node (duplicating it) or the drag is cancelled outright -->
	<NodeViewWrapper
		as="div"
		class="media-node"
		:class="[attrs.tag, { selected }]"
		draggable="true"
		data-drag-handle
		@dblclick="edit"
	>
		<video
			v-if="attrs.tag === 'video'"
			:src="attrs.src ?? undefined"
			:width="attrs.width ?? undefined"
			:height="attrs.height ?? undefined"
			:loop="attrs.loop"
			controls
		/>
		<audio v-else-if="attrs.tag === 'audio'" :src="attrs.src ?? undefined" :loop="attrs.loop" controls />
		<!-- iframe preview is non-interactive so clicks reach the node wrapper for selection/edit -->
		<iframe
			v-else
			class="media-iframe"
			:src="attrs.src ?? undefined"
			:width="attrs.width ?? undefined"
			:height="attrs.height ?? undefined"
			tabindex="-1"
		></iframe>
	</NodeViewWrapper>
</template>

<style lang="scss" scoped>
.media-node {
	display: inline-block;
	max-inline-size: 100%;

	&.selected {
		outline: 2px solid var(--theme--primary);
	}

	// padding gives the small audio player a bigger click/drag target
	&.audio {
		padding: 0.5rem;
	}

	video,
	audio,
	.media-iframe {
		display: block; // avoids the inline baseline gap below the element
		max-inline-size: 100%;
	}

	.media-iframe {
		pointer-events: none;
	}
}
</style>
