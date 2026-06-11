import axios from 'axios';
import type { Reporter, TestModule } from 'vitest/node';
import { USER } from '../common/variables';
import { sleep } from '../utils/sleep';

// Drives the sequential gate (see setup/environment.ts) by recording one completion row per finished
// test module on the shared Directus server. This runs in the main process and fires for every
// module — passed, failed, skipped, or crashed-worker — so a completion can't be lost the way a
// worker-side teardown POST can (a worker OOM, or a transient request failure mid-teardown). A single
// lost completion used to leave the gate's count permanently short, hanging every gated successor in
// its environment setup until the CI job was killed at 60min. The gate counts DISTINCT paths, so this
// is idempotent with the teardown fallback in environment.ts: whichever fires first (or both) counts
// once.
export default class CompletionReporter implements Reporter {
	async onTestModuleEnd(testModule: TestModule): Promise<void> {
		const serverUrl = process.env['serverUrl'];

		// No gate when the shared bootstrap server isn't in play (BLACKBOX_NO_GATE local runs, TEST_LOCAL).
		if (!serverUrl || process.env['BLACKBOX_NO_GATE']) return;

		// Same canonical path the worker posts (see environment.ts) so DISTINCT-count dedupes the two.
		const body = { test_file_path: testModule.moduleId.split('blackbox')[1] ?? testModule.moduleId };

		// Retry so a transient blip on a loaded server (mssql) doesn't drop the completion.
		for (let attempt = 0; attempt < 5; attempt++) {
			try {
				await axios.post(`${serverUrl}/items/tests_flow_completed`, body, {
					headers: {
						Authorization: `Bearer ${USER.TESTS_FLOW.TOKEN}`,
						'Content-Type': 'application/json',
					},
				});

				return;
			} catch {
				await sleep(1000);
			}
		}
	}
}
