import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';

/**
 * Subscript / superscript marks made mutually exclusive: each `excludes` the other, so applying
 * one removes the other on the same selection (matching TinyMCE). The base marks don't exclude
 * each other by default, which would let `<sub>` and `<sup>` stack on the same text.
 */
export const CustomSubscript = Subscript.extend({ excludes: 'superscript' });
export const CustomSuperscript = Superscript.extend({ excludes: 'subscript' });
