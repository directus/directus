<template>
	<div class="theme-code-group">
		<div class="theme-code-group__nav">
			<ul class="theme-code-group__ul">
				<li v-for="(tab, i) in codeTabs" :key="tab.title" class="theme-code-group__li">
					<button
						class="theme-code-group__nav-tab"
						:class="{
							'theme-code-group__nav-tab-active': i === activeCodeTabIndex,
						}"
						@click="changeCodeTab(i)"
					>
						{{ tab.title }}
					</button>
				</li>
			</ul>
		</div>
		<slot />
		<pre v-if="codeTabs.length < 1" class="pre-blank">// Make sure to add code blocks to your code group</pre>
	</div>
</template>

<script>
export default {
	name: 'CodeGroup',
	data() {
		return {
			codeTabs: [],
			activeCodeTabIndex: -1,
		};
	},
	watch: {
		activeCodeTabIndex(index) {
			this.codeTabs.forEach((tab) => {
				tab.elm.classList.remove('theme-code-block__active');
			});
			this.codeTabs[index].elm.classList.add('theme-code-block__active');
		},
	},
	mounted() {
		this.codeTabs = (this.$slots.default || [])
			.filter((slot) => Boolean(slot.componentOptions))
			.map((slot, index) => {
				if (slot.componentOptions.propsData.active === '') {
					this.activeCodeTabIndex = index;
				}

				return {
					title: slot.componentOptions.propsData.title,
					elm: slot.elm,
				};
			});

		if (this.activeCodeTabIndex === -1 && this.codeTabs.length > 0) {
			this.activeCodeTabIndex = 0;
		}
	},
	methods: {
		changeCodeTab(index) {
			this.activeCodeTabIndex = index;
		},
	},
};
</script>

<style lang="stylus" scoped>
.theme-code-group__nav {
	margin-bottom: -35px;
	padding-top: 10px;
	padding-bottom: 22px;
	padding-left: 10px;
	background-color: var(--background-normal);
	border-top-left-radius: 6px;
	border-top-right-radius: 6px;
}

.theme-code-group__ul {
	display: inline-flex;
	margin: auto 0;
	padding-left: 0;
	list-style: none;
}

.theme-code-group__nav-tab {
	padding: 5px;
	color: rgba(255, 255, 255, 0.9);
	font-weight: 600;
	font-size: 0.85em;
	line-height: 1.4;
	background-color: transparent;
	border: 0;
	cursor: pointer;
}

.theme-code-group__nav-tab-active {
	border-bottom: #42b983 1px solid;
}

.pre-blank {
	color: #42b983;
}
</style>
