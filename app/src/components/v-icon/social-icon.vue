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
		return h({ template: socialIcon?.html[0] });
	},
});
</script>
