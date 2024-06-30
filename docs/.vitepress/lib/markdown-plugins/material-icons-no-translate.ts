// @ts-ignore
import iterator from 'markdown-it-for-inline';

const MATERIAL_ICON_RE = /<span(.*\bmi\b.*)>/;

export function useMaterialIconsNoTranslate(md: any) {
	md.use(iterator, 'mi_no_translate', 'html_inline', (tokens: any, idx: number) => {
		const match = tokens[idx].content.match(MATERIAL_ICON_RE);

		if (match) tokens[idx].content = `<span translate="no"${match[1]}>`;
	});
}
