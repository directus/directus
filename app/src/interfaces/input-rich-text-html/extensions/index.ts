import TextAlign from '@tiptap/extension-text-align';
import StarterKit from '@tiptap/starter-kit';
import { CustomImage } from './image';

/**
 * The editor's extension set. Shared by input-rich-text-html.vue and the round-trip tests so the
 * two never drift — the schema here is the single source of truth for what HTML round-trips.
 */
export const editorExtensions = [StarterKit, CustomImage, TextAlign.configure({ types: ['heading', 'paragraph'] })];
