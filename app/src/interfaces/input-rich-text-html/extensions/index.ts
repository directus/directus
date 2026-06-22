import StarterKit from '@tiptap/starter-kit';
import { CustomImage } from './image';
import { TextAlignment } from './text-alignment';

/**
 * The editor's extension set. Shared by input-rich-text-html.vue and the round-trip tests so the
 * two never drift — the schema here is the single source of truth for what HTML round-trips.
 */
export const editorExtensions = [StarterKit, CustomImage, TextAlignment];
