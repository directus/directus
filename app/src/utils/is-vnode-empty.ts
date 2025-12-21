import { VNode, Comment, Text, Fragment } from 'vue';

function asArray(vnode: VNode | VNode[]): VNode[] {
	return Array.isArray(vnode) ? vnode : [vnode];
}

// see https://github.com/vuejs/core/issues/4733#issuecomment-1694589309
export default function isVNodeEmpty(vnode: VNode | VNode[] | undefined | null): boolean {
	return (
		!vnode ||
		asArray(vnode).every(
			(v) =>
				v.type === Comment || (v.type === Text && !v.children?.length) || (v.type === Fragment && !v.children?.length),
		)
	);
}
