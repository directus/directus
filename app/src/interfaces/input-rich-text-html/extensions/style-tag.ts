import { Node } from '@tiptap/vue-3';

function optionalAttribute(name: string) {
	return {
		default: null,
		parseHTML: (element: HTMLElement) => element.getAttribute(name) || null,
		renderHTML: (attributes: Record<string, unknown>) => (attributes[name] ? { [name]: attributes[name] } : {}),
	};
}

/** A `<style>` tag kept as an opaque block that stores its CSS text (field option `keepInlineStyles`). */
export const StyleTag = Node.create({
	name: 'styleTag',
	group: 'block',
	atom: true,
	selectable: true,

	addAttributes() {
		return {
			css: {
				default: '',
				parseHTML: (element) => element.textContent ?? '',
				rendered: false,
			},
			media: optionalAttribute('media'),
			type: optionalAttribute('type'),
		};
	},

	parseHTML() {
		// a matching rule wins over ProseMirror's built-in ignore of <style>
		return [{ tag: 'style' }];
	},

	renderHTML({ node, HTMLAttributes }) {
		return ['style', HTMLAttributes, node.attrs['css']];
	},

	// a live <style> in the editor would restyle the whole app, so the editor shows the CSS as text
	addNodeView() {
		return ({ node }) => {
			const dom = document.createElement('div');
			dom.className = 'style-tag';
			dom.contentEditable = 'false';
			dom.dataset['styleTag'] = '';

			const code = document.createElement('pre');
			code.textContent = node.attrs['css'];
			dom.append(code);

			return { dom };
		};
	},
});
