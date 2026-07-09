import type { CommandGroup } from '../kernel/command.js';
import { profile } from './profile/index.js';

// Built-in command groups, statically registered — bundled, zero-config.
export const commands: readonly CommandGroup[] = [profile];
