import { files } from 'directus-files';
import { WebContainer } from '@webcontainer/api';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { Ref, ref } from 'vue';

export function useOS(browserURL: Ref<string>) {
	const webcontainerInstance = ref<WebContainer | null>(null);
	const terminal = ref<Terminal | null>(null)

	window.addEventListener('load', async () => {
		files['data.db']['file']['contents'] = bufferToUint8Array(files['data.db']['file']['contents'].data);

		// Call only once
		webcontainerInstance.value = await WebContainer.boot();
		await webcontainerInstance.value.mount(files);

		const fitAddon = new FitAddon();

		terminal.value = new Terminal({
			convertEol: true,
		});

		terminal.value.loadAddon(fitAddon);

		terminal.value.onRender(() => {
			fitAddon.fit();
		})

		window.addEventListener('resize', () => {
			fitAddon.fit();
		});


		const exitCode = await installDependencies(terminal.value);

		if (exitCode !== 0) {
			throw new Error('Installation failed');
		}

		startDevServer(terminal.value);
	});

	return {
		webcontainerInstance,
		terminal,
	}

	function bufferToUint8Array(buffer: any) {
		const uint8Array = new Uint8Array(buffer.length);

		for (let i = 0; i < buffer.length; i++) {
			uint8Array[i] = buffer[i];
		}

		return uint8Array;
	}

	async function installDependencies(terminal: Terminal) {
		// Install dependencies
		const installProcess = await webcontainerInstance.value!.spawn('pnpm', ['install']);

		installProcess.output.pipeTo(
			new WritableStream({
				write(data) {
					terminal.write(data);
				},
			})
		);

		// Wait for install command to exit
		return installProcess.exit;
	}

	async function startDevServer(terminal: Terminal) {
		const serverProcess = await webcontainerInstance.value!.spawn('node', ['./api/dist/cli/run.js', 'start']);

		// const serverProcess = await webcontainerInstance!.spawn('pnpm', ['run', 'dev']);

		serverProcess.output.pipeTo(
			new WritableStream({
				write(data) {
					terminal.write(data);
				},
			})
		);

		// Wait for `server-ready` event
		webcontainerInstance.value!.on('server-ready', (port, url) => {
			browserURL.value = url;
		});
	}
}
