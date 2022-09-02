<template>
	<render />
</template>

<script setup lang="ts">
import { h } from 'vue';
import { icon, findIconDefinition, IconName } from '@fortawesome/fontawesome-svg-core';

interface Props {
	name: IconName;
}

const props = defineProps<Props>();

const render = () => {
	const socialIcon = icon(findIconDefinition({ prefix: 'fab', iconName: props.name }));

	if (socialIcon && socialIcon.abstract[0] && socialIcon.abstract[0].children && socialIcon.abstract[0].children[0]) {
		return h(
			'svg',
			{
				...socialIcon.abstract[0].attributes,
			},
			h('path', { ...socialIcon.abstract![0].children![0].attributes })
		);
	}

	return null;
};
</script>
