<template>
	<main class="page">
		<slot name="top" />

		<Content class="theme-default-content" />
		<PageEdit />

		<PageNav v-bind="{ sidebarItems }" />

		<slot name="bottom" />
	</main>
</template>

<script>
import PageEdit from '@theme/components/PageEdit.vue';
import PageNav from '@theme/components/PageNav.vue';

export default {
	components: { PageEdit, PageNav },
	props: ['sidebarItems'],
	mounted() {
		document.addEventListener('mouseover', this.toggleVideo);
		document.addEventListener('mouseout', this.toggleVideo);
	},
	unmounted() {
		document.removeEventListener('mouseover', this.toggleVideo);
		document.removeEventListener('mouseout', this.toggleVideo);
	},
	methods: {
		toggleVideo(event) {
			if (event.target.tagName === 'VIDEO') {
				if(event.type === "mouseover") {
					event.target.play();
				} else {
					event.target.pause();
					event.target.currentTime = 0;
				}
			}
		},
	},
};
</script>

<style lang="stylus">
/* stylelint-disable */
@require '../styles/wrapper.styl'

.page
  padding-bottom 2rem
  display block
</style>
