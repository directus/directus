import { auth, useDirectus } from '../src/index.js';

const _client = useDirectus('https://localhost:8055').use(auth('cookie'));
