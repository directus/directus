<script setup lang="ts">
import { h } from 'vue';
import { findIconDefinition, icon, IconName, library } from '@fortawesome/fontawesome-svg-core';
import { fab } from '@fortawesome/free-brands-svg-icons';

library.add(fab);

const props = defineProps<{
	name: IconName;
}>();

const render = () => {
	const socialIcon = icon(findIconDefinition({ prefix: 'fab', iconName: props.name }));

	if (socialIcon && socialIcon.abstract[0] && socialIcon.abstract[0].children && socialIcon.abstract[0].children[0]) {
		return h(
			'svg',
			{
				...socialIcon.abstract[0].attributes,
			},
			h('path', { ...socialIcon.abstract![0].children![0].attributes }),
		);
	}

	return null;
};
</script>

<template>
	<render />
</template>
