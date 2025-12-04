import type { ACTION, ClientMessage } from '@directus/types/collab';

export type JoinMessage = Extract<ClientMessage, { action: typeof ACTION.CLIENT.JOIN }>;
export type LeaveMessage = Extract<ClientMessage, { action: typeof ACTION.CLIENT.LEAVE }>;
export type SaveMessage = Extract<ClientMessage, { action: typeof ACTION.CLIENT.SAVE }>;
export type UpdateMessage = Extract<ClientMessage, { action: typeof ACTION.CLIENT.UPDATE }>;
export type FocusMessage = Extract<ClientMessage, { action: typeof ACTION.CLIENT.FOUCS }>;
