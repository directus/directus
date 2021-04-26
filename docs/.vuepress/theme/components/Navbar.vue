<template>
	<header class="navbar">
		<SidebarButton @toggle-sidebar="$emit('toggle-sidebar')" />

		<RouterLink :to="$localePath" class="home-link">
			<img v-if="$site.themeConfig.logo" class="logo" :src="$withBase($site.themeConfig.logo)" :alt="$siteTitle" />
			<span v-if="$siteTitle" ref="siteName" class="site-name" :class="{ 'can-hide': $site.themeConfig.logo }">
				{{ $siteTitle }}
			</span>
		</RouterLink>

		<div
			class="links"
			:style="
				linksWrapMaxWidth
					? {
							'max-width': linksWrapMaxWidth + 'px',
					  }
					: {}
			"
		>
			<NavLinks class="can-hide" />
			<AlgoliaSearchBox v-if="isAlgoliaSearch" :options="algolia" />
			<SearchBox v-else-if="$site.themeConfig.search !== false && $page.frontmatter.search !== false" />
		</div>
	</header>
</template>

<script>
import AlgoliaSearchBox from '@AlgoliaSearchBox';
import SearchBox from '@SearchBox';
import SidebarButton from '@theme/components/SidebarButton.vue';
import NavLinks from '@theme/components/NavLinks.vue';

export default {
	name: 'Navbar',

	components: {
		SidebarButton,
		NavLinks,
		SearchBox,
		AlgoliaSearchBox,
	},

	data() {
		return {
			linksWrapMaxWidth: null,
		};
	},

	computed: {
		algolia() {
			return this.$themeLocaleConfig.algolia || this.$site.themeConfig.algolia || {};
		},

		isAlgoliaSearch() {
			return this.algolia && this.algolia.apiKey && this.algolia.indexName;
		},
	},

	mounted() {
		const MOBILE_DESKTOP_BREAKPOINT = 719; // refer to config.styl
		const NAVBAR_VERTICAL_PADDING = parseInt(css(this.$el, 'paddingLeft')) + parseInt(css(this.$el, 'paddingRight'));
		const handleLinksWrapWidth = () => {
			if (document.documentElement.clientWidth < MOBILE_DESKTOP_BREAKPOINT) {
				this.linksWrapMaxWidth = null;
			} else {
				this.linksWrapMaxWidth =
					this.$el.offsetWidth -
					NAVBAR_VERTICAL_PADDING -
					((this.$refs.siteName && this.$refs.siteName.offsetWidth) || 0);
			}
		};
		handleLinksWrapWidth();
		window.addEventListener('resize', handleLinksWrapWidth, false);
	},
};

function css(el, property) {
	// NOTE: Known bug, will return 'auto' if style value is 'auto'
	const win = el.ownerDocument.defaultView;
	// null means not to return pseudo styles
	return win.getComputedStyle(el, null)[property];
}
</script>

<style lang="stylus">
/* stylelint-disable */
$navbar-vertical-padding = 0.7rem
$navbar-horizontal-padding = 30px

.navbar
  padding $navbar-vertical-padding $navbar-horizontal-padding
  line-height $navbarHeight - 1.4rem

  background-color: #2CCDA6;

  a, span, img
    display inline-block
  .home-link
		display inline-flex
		align-items center
		height 100%
  .logo
    margin-right 0.8rem
  .site-name
    font-size 1.3rem
    font-weight 600
    color $textColor
    position relative

    opacity: 0;
    user-select: none;

  .links
    padding-left 1.5rem
    box-sizing border-box
    // background-color white
    white-space nowrap
    position absolute
    right $navbar-horizontal-padding
    top $navbar-vertical-padding
    display flex
    color white
    .search-box
      flex 0 0 auto
      vertical-align top
      input
        border none
        color $textColor
        padding 0 0.5rem 0 2rem
        background-position 0.5rem 0.5rem
        @media (max-width: 959px)
          padding 0 1rem 0 1rem
        &:focus
          padding 0 0.5rem 0 2rem
      .suggestions
        border none
        box-shadow 0 2px 40px 0 rgba(23, 41, 64, 0.05), 0 5px 10px 0 rgba(23, 41, 64, 0.1)
      .suggestion
        &.focused
          a
            color darken($accentColor, 10%)
        a
          color $textColor

@media (max-width: $MQMobile)
  .navbar
    padding-left 4rem
    .can-hide
      display none
    .links
      padding-right 1.5rem
    .site-name
      width calc(100vw - 9.4rem)
      overflow hidden
      white-space nowrap
      text-overflow ellipsis
</style>
