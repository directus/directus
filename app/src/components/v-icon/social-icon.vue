<script lang="ts">
import { defineComponent, h, PropType } from 'vue';
import { icon, findIconDefinition, IconName } from '@fortawesome/fontawesome-svg-core';

export default defineComponent({
	props: {
		name: {
			type: String as PropType<IconName>,
			required: true,
		},
	},
	render() {
		const socialIcon = icon(findIconDefinition({ prefix: 'fab', iconName: this.name }));

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
	},
});
</script>
