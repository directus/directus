import StarterKit from '@tiptap/starter-kit';
import { CustomImage } from './image';
import { CustomSubscript, CustomSuperscript } from './subscript-superscript';
import { TextStyle } from './text-style';

/**
 * The editor's extension set. Shared by input-rich-text-html.vue and the round-trip tests so the
 * two never drift — the schema here is the single source of truth for what HTML round-trips.
 */
export const editorExtensions = [StarterKit, CustomImage, CustomSubscript, CustomSuperscript, TextStyle];
