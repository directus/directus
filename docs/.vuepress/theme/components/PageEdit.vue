<template>
	<footer class="page-edit">
		<div v-if="editLink" class="edit-link">
			<a :href="editLink" target="_blank" rel="noopener noreferrer">{{ editLinkText }}</a>
			<OutboundLink />
		</div>

		<div v-if="lastUpdated" class="last-updated">
			<span class="prefix">{{ lastUpdatedText }}:</span>
			<span class="time">{{ lastUpdated }}</span>
		</div>
	</footer>
</template>

<script>
import isNil from 'lodash/isNil';
import { endingSlashRE, outboundRE } from '../util';

export default {
	name: 'PageEdit',

	computed: {
		lastUpdated() {
			return this.$page.lastUpdated;
		},

		lastUpdatedText() {
			if (typeof this.$themeLocaleConfig.lastUpdated === 'string') {
				return this.$themeLocaleConfig.lastUpdated;
			}
			if (typeof this.$site.themeConfig.lastUpdated === 'string') {
				return this.$site.themeConfig.lastUpdated;
			}
			return 'Last Updated';
		},

		editLink() {
			const showEditLink = isNil(this.$page.frontmatter.editLink)
				? this.$site.themeConfig.editLinks
				: this.$page.frontmatter.editLink;

			const { repo, docsDir = '', docsBranch = 'master', docsRepo = repo } = this.$site.themeConfig;

			if (showEditLink && docsRepo && this.$page.relativePath) {
				return this.createEditLink(repo, docsRepo, docsDir, docsBranch, this.$page.relativePath);
			}
			return null;
		},

		editLinkText() {
			return this.$themeLocaleConfig.editLinkText || this.$site.themeConfig.editLinkText || `Edit this page`;
		},
	},

	methods: {
		createEditLink(repo, docsRepo, docsDir, docsBranch, path) {
			const bitbucket = /bitbucket.org/;
			if (bitbucket.test(docsRepo)) {
				const base = docsRepo;
				return (
					base.replace(endingSlashRE, '') +
					`/src` +
					`/${docsBranch}/` +
					(docsDir ? docsDir.replace(endingSlashRE, '') + '/' : '') +
					path +
					`?mode=edit&spa=0&at=${docsBranch}&fileviewer=file-view-default`
				);
			}

			const gitlab = /gitlab.com/;
			if (gitlab.test(docsRepo)) {
				const base = docsRepo;
				return (
					base.replace(endingSlashRE, '') +
					`/-/edit` +
					`/${docsBranch}/` +
					(docsDir ? docsDir.replace(endingSlashRE, '') + '/' : '') +
					path
				);
			}

			const base = outboundRE.test(docsRepo) ? docsRepo : `https://github.com/${docsRepo}`;
			return (
				base.replace(endingSlashRE, '') +
				'/edit' +
				`/${docsBranch}/` +
				(docsDir ? docsDir.replace(endingSlashRE, '') + '/' : '') +
				path
			);
		},
	},
};
</script>

<style lang="stylus">
@require '../styles/wrapper.styl'

.page-edit
  @extend $wrapper
  padding-top 3rem
  padding-bottom 1rem
  overflow auto

  .edit-link
    display inline-block
    a
      color var(--foreground-subdued)
      margin-right 0.25rem
    .icon.outbound
      color var(--foreground-subdued)
  .last-updated
    float right
    font-size 0.9em
    .prefix
      font-weight 500
      color var(--foreground-subdued)
    .time
      font-weight 400
      color var(--foreground-subdued)

@media (max-width: $MQMobile)
  .page-edit
    .edit-link
      margin-bottom 0.5rem
    .last-updated
      font-size 0.8em
      float none
      text-align left
</style>
