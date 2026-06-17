import { TextStyleKit } from '@tiptap/extension-text-style';
import StarterKit from '@tiptap/starter-kit';

/**
 * Single source of truth for the editor's ProseMirror schema. Imported by both the editor
 * component and round-trip.test.ts so the test can never drift from the real schema.
 *
 * TextStyleKit adds the `textStyle` mark (StarterKit has none) plus FontFamily, FontSize,
 * Color and BackgroundColor. LineHeight is disabled — out of scope for CMS-2637 and would
 * otherwise change line-height round-trip behavior.
 */
export const editorExtensions = [StarterKit, TextStyleKit.configure({ lineHeight: false })];
