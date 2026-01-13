import type { ACTION, ClientMessage } from '@directus/types/collab';

export type JoinMessage = Extract<ClientMessage, { action: typeof ACTION.CLIENT.JOIN }>;
export type LeaveMessage = Extract<ClientMessage, { action: typeof ACTION.CLIENT.LEAVE }>;
export type UpdateMessage = Extract<ClientMessage, { action: typeof ACTION.CLIENT.UPDATE }>;
export type UpdateAllMessage = Extract<ClientMessage, { action: typeof ACTION.CLIENT.UPDATE_ALL }>;
export type FocusMessage = Extract<ClientMessage, { action: typeof ACTION.CLIENT.FOCUS }>;
