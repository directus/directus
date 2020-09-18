<template>
	<div class="interface-markdown" :class="{ tabbed }">
		<div v-if="tabbed" class="toolbar">
			<v-tabs v-model="currentTab">
				<v-tab>
					<v-icon name="code" left />
					{{ $t('interfaces.markdown.edit') }}
				</v-tab>
				<v-tab>
					<v-icon name="visibility" outline left />
					{{ $t('interfaces.markdown.preview') }}
				</v-tab>
			</v-tabs>
		</div>
		<v-textarea
			v-show="showEdit"
			:placeholder="placeholder"
			:value="value"
			:disabled="disabled"
			@input="$listeners.input"
		/>
		<div v-show="showPreview" class="preview-container">
			<div class="preview" v-html="html"></div>
		</div>
	</div>
</template>

<script lang="ts">
import marked from 'marked';
import { defineComponent, computed, ref } from '@vue/composition-api';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		placeholder: {
			type: String,
			default: null,
		},
		tabbed: {
			type: Boolean,
			default: true,
		},
	},
	setup(props) {
		const currentTab = ref([0]);

		const html = computed(() => (props.value ? marked(props.value) : ''));
		const showEdit = computed(() => !props.tabbed || currentTab.value[0] === 0);
		const showPreview = computed(() => !props.tabbed || currentTab.value[0] !== 0);

		return { html, currentTab, showEdit, showPreview };
	},
});
</script>

<style lang="scss" scoped>
.interface-markdown {
	--v-textarea-min-height: var(--input-height-tall);
	--v-textarea-max-height: 400px;
	--v-tab-background-color: var(--background-subdued);
	--v-tab-background-color-active: var(--background-subdued);

	display: flex;
	flex-wrap: wrap;

	.toolbar {
		width: 100%;
		height: 42px;
		background-color: var(--background-subdued);
		border: var(--border-width) solid var(--border-normal);
		border-radius: var(--border-radius) var(--border-radius) 0 0;
	}

	.v-textarea {
		height: unset;
		min-height: var(--input-height-tall);
		border-radius: var(--border-radius) 0 0 var(--border-radius);
	}

	.preview-container {
		min-height: var(--v-textarea-min-height);
		max-height: var(--v-textarea-max-height);
		padding: var(--input-padding);
		overflow-y: auto;
		border: var(--border-width) solid var(--border-normal);
		border-radius: 0 var(--border-radius) var(--border-radius) 0;
	}

	.v-textarea,
	.preview-container {
		flex-basis: 100px;
		flex-grow: 1;
	}

	&:not(.tabbed) .preview-container {
		border-left: none;
	}

	&.tabbed .v-textarea {
		border-radius: 0 0 var(--border-radius) var(--border-radius);
	}

	&.tabbed .preview-container {
		border-radius: 0 0 var(--border-radius) var(--border-radius);
	}

	&.tabbed .toolbar {
		border-bottom: none;
	}
	&.tabbed .expand {
		right: 0;
	}
	&.tabbed.hasScrollbar .expand {
		right: 14px;
	}

	::v-deep {
		.preview {
			font-weight: 500;
			font-size: 14px;
			& > *:first-child {
				margin-top: 0;
			}
			& > *:last-child {
				margin-bottom: 0;
			}
			a {
				text-decoration: underline;
			}
			h1,
			h2,
			h3,
			h4,
			h5,
			h6 {
				position: relative;
				margin: 20px 0 10px;
				padding: 0;
				font-weight: 600;
				cursor: text;
			}
			pre {
				padding: 6px 10px;
				overflow: auto;
				font-size: 13px;
				line-height: 19px;
				background-color: var(--background-page);
				border: 1px solid var(--background-normal);
				border-radius: var(--border-radius);
			}
			code,
			tt {
				margin: 0 2px;
				padding: 0 5px;
				white-space: nowrap;
				background-color: var(--background-page);
				border: 1px solid var(--background-normal);
				border-radius: var(--border-radius);
			}
			pre code {
				margin: 0;
				padding: 0;
				white-space: pre;
				background: transparent;
				border: none;
			}
			pre code,
			pre tt {
				background-color: transparent;
				border: none;
			}
			h1 tt,
			h1 code {
				font-size: inherit;
			}
			h2 tt,
			h2 code {
				font-size: inherit;
			}
			h3 tt,
			h3 code {
				font-size: inherit;
			}
			h4 tt,
			h4 code {
				font-size: inherit;
			}
			h5 tt,
			h5 code {
				font-size: inherit;
			}
			h6 tt,
			h6 code {
				font-size: inherit;
			}
			h1 {
				font-size: 28px;
			}
			h2 {
				font-size: 24px;
			}
			h3 {
				font-size: 18px;
			}
			h4 {
				font-size: 16px;
			}
			h5 {
				font-size: 14px;
			}
			h6 {
				color: var(--foreground-normal);
				font-size: 14px;
			}
			p,
			blockquote,
			ul,
			ol,
			dl,
			li,
			table,
			pre {
				margin: 15px 0;
			}
			& > h2:first-child {
				margin-top: 0;
				padding-top: 0;
			}
			& > h1:first-child {
				margin-top: 0;
				padding-top: 0;
			}
			& > h3:first-child,
			& > h4:first-child,
			& > h5:first-child,
			& > h6:first-child {
				margin-top: 0;
				padding-top: 0;
			}
			a:first-child h1,
			a:first-child h2,
			a:first-child h3,
			a:first-child h4,
			a:first-child h5,
			a:first-child h6 {
				margin-top: 0;
				padding-top: 0;
			}
			h1 p,
			h2 p,
			h3 p,
			h4 p,
			h5 p,
			h6 p {
				margin-top: 0;
			}
			li p.first {
				display: inline-block;
			}
			ul,
			ol {
				padding-left: 30px;
				li {
					margin: 0;
				}
			}
			ul :first-child,
			ol :first-child {
				margin-top: 0;
			}
			ul :last-child,
			ol :last-child {
				margin-bottom: 0;
			}
			blockquote {
				padding: 0 15px;
				color: var(--foreground-normal);
				border-left: 4px solid var(--background-normal);
			}
			blockquote > :first-child {
				margin-top: 0;
			}
			blockquote > :last-child {
				margin-bottom: 0;
			}
			table {
				padding: 0;
				border-collapse: collapse;
				border-spacing: 0;
			}
			table tr {
				margin: 0;
				padding: 0;
				background-color: white;
				border-top: 1px solid var(--background-normal);
			}
			table tr:nth-child(2n) {
				background-color: var(--background-page);
			}
			table tr th {
				margin: 0;
				padding: 6px 13px;
				font-weight: bold;
				text-align: left;
				border: 1px solid var(--background-normal);
			}
			table tr td {
				margin: 0;
				padding: 6px 13px;
				text-align: left;
				border: 1px solid var(--background-normal);
			}
			table tr th :first-child,
			table tr td :first-child {
				margin-top: 0;
			}
			table tr th :last-child,
			table tr td :last-child {
				margin-bottom: 0;
			}
			img {
				max-width: 100%;
			}
			.highlight pre {
				padding: 6px 10px;
				overflow: auto;
				font-size: 13px;
				line-height: 19px;
				background-color: var(--background-page);
				border: 1px solid var(--background-normal);
				border-radius: var(--border-radius);
			}
			hr {
				margin: 20px auto;
				border: none;
				border-top: 1px solid var(--background-normal);
			}
			b,
			strong {
				font-weight: 600;
			}
		}
	}
}
</style>
