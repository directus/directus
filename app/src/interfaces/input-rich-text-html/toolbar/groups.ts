export interface ToolbarGroup {
	id: string;
	/** higher = kept longer; lower-priority groups overflow first */
	priority: number;
	/** pinned groups never move into the "Show More" menu */
	pinned?: boolean;
	/** render the whole group as a single popover button + caret */
	popover?: boolean;
	/** collapsed-state fallback icon for a popover group when no child is active */
	icon?: string;
	/** member button keys, in render order */
	keys: string[];
}

export const toolbarGroups: ToolbarGroup[] = [
	{ id: 'history', priority: 100, pinned: true, keys: ['undo', 'redo'] },
	{
		id: 'format',
		priority: 90,
		pinned: true,
		keys: ['bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript'],
	},
	{ id: 'heading', priority: 62, keys: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] },
	{
		id: 'align',
		priority: 60,
		popover: true,
		pinned: true,
		icon: 'format_align_left',
		keys: ['alignleft', 'aligncenter', 'alignright', 'alignjustify', 'alignnone'],
	},
	{ id: 'direction', priority: 58, keys: ['ltr', 'rtl'] },
	{ id: 'list', priority: 55, pinned: true, keys: ['numlist', 'bullist', 'indent', 'outdent'] },
	{ id: 'style', priority: 70, pinned: true, keys: ['fontfamily', 'fontsize', 'forecolor', 'backcolor'] },
	{ id: 'block', priority: 60, keys: ['blockquote', 'hr'] },
	{ id: 'insert', priority: 50, keys: ['customLink', 'unlink', 'customImage', 'customMedia'] },
	{ id: 'code', priority: 40, keys: ['code', 'customPre'] },
	{ id: 'clipboard', priority: 30, keys: ['cut', 'copy', 'paste', 'remove', 'selectall'] },
	{ id: 'tools', priority: 20, keys: ['removeformat'] },
	{ id: 'view', priority: 10, pinned: true, keys: ['fullscreen'] },
];

const groupByKey = new Map<string, ToolbarGroup>();

for (const group of toolbarGroups) {
	for (const key of group.keys) groupByKey.set(key, group);
}

export function groupForKey(key: string): ToolbarGroup | undefined {
	return groupByKey.get(key);
}
