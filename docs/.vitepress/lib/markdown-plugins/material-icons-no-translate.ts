// @ts-ignore
import iterator from 'markdown-it-for-inline';

const MATERIAL_ICON_RE = /<span(.*\bmi\b.*)>/;

export function useMaterialIconsNoTranslate(md: any) {
	md.use(iterator, 'mi_no_translate', 'html_inline', function (tokens: any, idx: number) {
		const m = tokens[idx].content.match(MATERIAL_ICON_RE);

		if (m) {
			tokens[idx].content = `<span${m[1]} translate="no">`;
		}
	});
}
