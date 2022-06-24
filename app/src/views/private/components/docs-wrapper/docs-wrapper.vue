<template>
	<div class="md" :class="pageClass"><slot /></div>
</template>

<script lang="ts">
import { computed, defineComponent, inject, onMounted, Ref, watch } from 'vue';
import { useRoute } from 'vue-router';

export default defineComponent({
	props: {
		frontmatter: {
			type: Object,
			required: true,
		},
	},
	emits: ['update:title', 'update:modularExtension'],
	setup(props, { emit }) {
		const route = useRoute();

		const mainElement = inject<Ref<Element | undefined>>('main-element');

		const pageClass = computed(() => props.frontmatter?.pageClass);

		watch(
			() => props.frontmatter,
			() => {
				emit('update:title', props.frontmatter.title);
				emit('update:modularExtension', props.frontmatter.modularExtension);
			},
			{ immediate: true }
		);

		onMounted(() => {
			if (route.hash && mainElement?.value) {
				const linkedEl = document.querySelector(route.hash) as HTMLElement;

				if (linkedEl) {
					mainElement.value.scrollTo({ top: linkedEl.offsetTop - 100 });
				}
			}
		});

		return { pageClass };
	},
});
</script>

<style scoped>
.error {
	padding: 20vh 0;
}

.md {
	max-width: 740px;
	color: var(--foreground-normal-alt);
	font-weight: 400;
	font-size: 16px;
	line-height: 27px;
}

.md > :deep(*:first-child) {
	margin-top: 0;
}

.md > :deep(*:last-child) {
	margin-bottom: 0;
}

.md :deep(a) {
	color: var(--primary-110);
	font-weight: 500;
	text-decoration: none;
}

.md :deep(h1),
.md :deep(h2),
.md :deep(h3),
.md :deep(h4),
.md :deep(h5),
.md :deep(h6) {
	position: relative;
	margin: 40px 0 8px;
	padding: 0;
	color: var(--foreground-normal-alt);
	font-weight: 700;
	cursor: text;
}

.md :deep(h1 a),
.md :deep(h2 a),
.md :deep(h3 a),
.md :deep(h4 a),
.md :deep(h5 a),
.md :deep(h6 a) {
	position: absolute;
	right: 100%;
	padding-right: 4px;
	opacity: 0;
}

.md :deep(h1) {
	margin-bottom: 40px;
	font-size: 35px;
	line-height: 44px;
}

.md :deep(h2) {
	margin-top: 60px;
	margin-bottom: 20px;
	padding-bottom: 4px;
	font-size: 24px;
	line-height: 34px;
	border-bottom: 2px solid var(--border-subdued);
}

.md :deep(h3) {
	margin-bottom: 0px;
	font-size: 19px;
	line-height: 24px;
}

.md :deep(h4) {
	font-size: 16px;
}

.md :deep(h5) {
	font-size: 14px;
}

.md :deep(h6) {
	color: var(--foreground-normal);
	font-size: 14px;
}

.md :deep(pre) {
	padding: 16px 20px;
	overflow: auto;
	font-size: 13px;
	line-height: 24px;
	background-color: var(--background-normal);
	border-radius: var(--border-radius);
}

.md :deep(code),
.md :deep(tt) {
	margin: 0 1px;
	padding: 0 4px;
	font-size: 15px;
	font-family: var(--family-monospace);
	white-space: nowrap;
	background-color: var(--background-page);
	border: 1px solid var(--background-normal);
	border-radius: var(--border-radius);
}

.md :deep(pre code) {
	margin: 0;
	padding: 0;
	white-space: pre;
	background: transparent;
	border: none;
}

.md :deep(p) {
	margin-block-start: 1em;
	margin-block-end: 1em;
	margin-inline-start: 0px;
	margin-inline-end: 0px;
}

.md :deep(h3 + p) {
	margin-block-start: 0.5em;
}

.md > :deep(h2:first-child) {
	margin-top: 0;
	padding-top: 0;
}

.md > :deep(h1:first-child) {
	margin-top: 0;
	padding-top: 0;
}

.md > :deep(h3:first-child),
.md > :deep(h4:first-child),
.md > :deep(h5:first-child),
.md > :deep(h6:first-child) {
	margin-top: 0;
	padding-top: 0;
}

.md :deep(blockquote) {
	max-width: 740px;
	margin-bottom: 4rem;
	padding: 0.25rem 0 0.25rem 1rem;
	color: var(--foreground-subdued);
	font-size: 18px;
	border-left: 2px solid var(--background-normal);
}

.md :deep(blockquote > :first-child) {
	margin-top: 0;
}

.md :deep(blockquote > :last-child) {
	margin-bottom: 0;
}

.md :deep(table) {
	min-width: 100%;
	margin: 40px 0;
	padding: 0;
	border-collapse: collapse;
	border-spacing: 0;
}

.md :deep(img),
.md :deep(video) {
	width: 100%;
	margin: 20px 0;
	border-radius: 6px;
}

.md :deep(table img) {
	margin: 0;
}

.md :deep(table tr) {
	margin: 0;
	padding: 0;
	border-top: 1px solid var(--border-normal);
}

.md :deep(table tr:nth-child(2n)) {
	background-color: var(--background-page);
}

.md :deep(table tr th) {
	margin: 0;
	padding: 8px 20px;
	font-weight: bold;
	text-align: left;
	border: 1px solid var(--border-normal);
}

.md :deep(table tr td) {
	margin: 0;
	padding: 8px 20px;
	text-align: left;
	border: 1px solid var(--border-normal);
}

.md :deep(a:first-child h1),
.md :deep(a:first-child h2),
.md :deep(a:first-child h3),
.md :deep(a:first-child h4),
.md :deep(a:first-child h5),
.md :deep(a:first-child h6) {
	margin-top: 0;
	padding-top: 0;
}

.md :deep(table tr th :first-child),
.md :deep(table tr td :first-child) {
	margin-top: 0;
}

.md :deep(table tr th :last-child),
.md :deep(table tr td :last-child) {
	margin-bottom: 0;
}

.md :deep(h1 a:hover),
.md :deep(h2 a:hover),
.md :deep(h3 a:hover),
.md :deep(h4 a:hover),
.md :deep(h5 a:hover),
.md :deep(h6 a:hover) {
	text-decoration: underline;
}

.md :deep(h1:hover a),
.md :deep(h2:hover a),
.md :deep(h3:hover a),
.md :deep(h4:hover a),
.md :deep(h5:hover a),
.md :deep(h6:hover a) {
	opacity: 1;
}

.md :deep(pre code),
.md :deep(pre tt) {
	background-color: transparent;
	border: none;
}

.md :deep(h1 tt),
.md :deep(h1 code),
.md :deep(h2 tt),
.md :deep(h2 code),
.md :deep(h3 tt),
.md :deep(h3 code),
.md :deep(h4 tt),
.md :deep(h4 code),
.md :deep(h5 tt),
.md :deep(h5 code),
.md :deep(h6 tt),
.md :deep(h6 code) {
	font-size: inherit;
}

.md :deep(h1 p),
.md :deep(h2 p),
.md :deep(h3 p),
.md :deep(h4 p),
.md :deep(h5 p),
.md :deep(h6 p) {
	margin-top: 0;
}

.md :deep(ul),
.md :deep(ol) {
	margin: 20px 0;
	padding-left: 20px;
}

.md :deep(ul li),
.md :deep(ol li) {
	margin: 8px 0;
	line-height: 24px;
}

.md :deep(ul ul),
.md :deep(ul ol),
.md :deep(ol ul),
.md :deep(ol ol) {
	margin: 4px 0;
}

.md :deep(ul ul li),
.md :deep(ul ol li),
.md :deep(ol ul li),
.md :deep(ol ol li) {
	margin: 4px 0;
	line-height: 24px;
}

.md :deep(img.no-margin) {
	margin: 0;
}

.md :deep(img.full) {
	width: 100%;
}

.md :deep(img.shadow) {
	box-shadow: 0px 5px 10px 0px rgb(23 41 64 / 0.1), 0px 2px 40px 0px rgb(23 41 64 / 0.05);
}

.md.page-reference {
	max-width: 1200px;
}

.md.page-reference :deep(hr) {
	position: relative;
	left: -2.5rem;
	width: calc(100% + 5rem);
	margin: 3rem 0;
}

.md.page-reference :deep(h2) {
	margin-top: 3rem;
	font-size: 2rem;
	border-bottom: 0;
}

.md.page-reference :deep(h3) {
	margin-top: 3rem;
	margin-bottom: 0.5rem;
	font-size: 1.2rem;
}

.md.page-reference :deep(h4) {
	margin-top: 2rem;
	margin-bottom: 0;
}

.md :deep(.heading-link) {
	color: var(--foreground-subdued);
	font-size: 16px;
}

.md :deep(.heading-link:hover) {
	color: var(--primary-110);
	text-decoration: none;
}

.md :deep(li p.first) {
	display: inline-block;
}

.md :deep(.table-of-contents ul),
.md :deep(.table-of-contents ol) {
	margin-top: 0;
}

.md :deep(.table-of-contents ul li),
.md :deep(.table-of-contents ol li) {
	margin: 4px 0;
}

.md :deep(.hint) {
	display: inline-block;
	width: 100%;
	margin: 20px 0;
	padding: 0 20px;
	background-color: var(--background-subdued);
	border-left: 2px solid var(--primary);
}

.md :deep(.two-up) {
	margin-top: 3rem;
}

.md :deep(.table-of-contents) {
	margin-top: -20px;
}

.md :deep(.hint-title) {
	margin-block-start: 1em;
	margin-block-end: 1em;
	margin-inline-start: 0px;
	margin-inline-end: 0px;
	font-weight: bold;
}

.md :deep(.hint.tip) {
	border-left: 2px solid var(--primary);
}

.md :deep(.hint.warning) {
	background-color: var(--warning-10);
	border-left: 2px solid var(--warning);
}

.md :deep(.hint.danger) {
	background-color: var(--danger-10);
	border-left: 2px solid var(--danger);
}

.md :deep(.two-up .right) {
	margin-top: 50px;
}

.md :deep(.two-up .right h5) {
	margin-top: 20px;
	color: var(--foreground-subdued);
}

.md :deep(span[mi]) {
	font-family: 'Material Icons Outline';
	font-weight: normal;
	font-style: normal;
	font-size: 18px;
	line-height: 1;
	letter-spacing: normal;
	text-transform: none;
	display: inline-block;
	white-space: nowrap;
	word-wrap: normal;
	direction: ltr;
	font-feature-settings: 'liga';
	-moz-osx-font-smoothing: grayscale;
}

.md :deep(span[mi][btn]) {
	color: var(--foreground-inverted);
	background-color: var(--primary);
	border-radius: 50%;
	width: 28px;
	height: 28px;
	vertical-align: middle;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 4px;
}
.md :deep(span[mi][btn][dngr]) {
	background-color: var(--danger-10);
	color: var(--danger);
}
.md :deep(span[mi][btn][sec]) {
	background-color: var(--primary-10);
	color: var(--primary);
}
.md :deep(span[mi][btn][warn]) {
	background-color: var(--warning-10);
	color: var(--warning);
}
.md :deep(span[mi][btn][outline]) {
	background-color: transparent;
	border: 2px solid var(--primary);
	color: var(--primary);
}
.md :deep(span[mi][btn][action]) {
	background-color: var(--success-10);
	color: var(--success);
}
.md :deep(span[mi][btn][muted]) {
	background-color: var(--background-normal);
	color: var(--foreground-normal);
}
.md :deep(span[mi][icon]) {
	vertical-align: middle;
	margin-bottom: 4px;
	color: var(--foreground-subdued);
}
.md :deep(span[mi][icon][prmry]) {
	color: var(--primary);
}
.md :deep(span[mi][icon][dark]) {
	color: var(--foreground-normal-alt);
}
.md :deep(span[mi][icon][dngr]) {
	color: var(--danger);
}
.md :deep(span[mi][icon][warn]) {
	color: var(--warning);
}

.md.page-reference :deep(.definitions) {
	font-size: 0.9rem;
	line-height: 1.5rem;
}

.md.page-reference :deep(.definitions > p) {
	margin: 0;
	padding: 0.8rem 0;
	border-bottom: 2px solid var(--border-subdued);
}

.md.page-reference :deep(.definitions > p:first-child) {
	border-top: 2px solid var(--border-subdued);
}

.md.page-reference :deep(.definitions > p > code:first-child) {
	margin-right: 0.2rem;
	padding: 0;
	font-weight: 700;
	font-size: 0.9rem;
	background: transparent;
	border: 0;
}

.md.page-reference :deep(.definitions > p > strong) {
	color: var(--foreground-subdued);
}

@media (min-width: 1000px) {
	.md :deep(.two-up) {
		display: grid;
		grid-gap: 40px;
		grid-template-columns: minmax(0, 4fr) minmax(0, 3fr);
		align-items: start;
	}

	.md :deep(.two-up .right) {
		position: sticky;
		top: 100px;
		margin-top: 0;
	}

	.md :deep(.two-up .left > *:first-child),
	.md :deep(.two-up .right > *:first-child) {
		margin-top: 0 !important;
	}
}
</style>
