import { createEnv } from './create-env.js';
import { test, describe, vi, beforeEach, afterEach } from 'vitest';
import { getConfigPath } from '../utils/get-config-path.js';
import { isDirectusVariable } from '../utils/is-directus-variable.js';
import { isFileKey } from '../utils/is-file-key.js';
import { readConfigurationFromProcess } from '../utils/read-configuration-from-process.js';
import { removeFileSuffix } from '../utils/remove-file-suffix.js';
import { cast } from './cast.js';
import { readConfigurationFromFile } from './read-configuration-from-file.js';

vi.mock('../utils/get-config-path.js');
vi.mock('../utils/is-directus-variable.js');
vi.mock('../utils/is-file-key.js');
vi.mock('../utils/read-configuration-from-process.js');
vi.mock('../utils/remove-file-suffix.js');
vi.mock('./cast.js');
vi.mock('./read-configuration-from-file.js');

afterEach(() => {
	vi.clearAllMocks();
});

