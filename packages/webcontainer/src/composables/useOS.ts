import { files } from 'directus-files';
import { WebContainer, FileSystemTree } from '@webcontainer/api';
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';
import { Ref, ref } from 'vue';

export function useOS(browserURL: Ref<string>) {
	const webcontainerInstance = ref<WebContainer | null>(null);


	window.addEventListener('load', async () => {
		// Call only once
		webcontainerInstance.value = await WebContainer.boot();
		await webcontainerInstance.value.mount(parseFileTree(files));
	});

	return {
		webcontainerInstance,
	}

	function parseFileTree(files: FileSystemTree): FileSystemTree {
		return Object.fromEntries(Object.entries(files).map(([file, data]) => {
			if ('directory' in data) {
				return [file, {
					directory: parseFileTree(data.directory),
				}];
			}

			if (typeof data.file.contents === 'object') {
				return [file, {
					file: {
						contents: bufferToUint8Array((data.file.contents as any).data),
					},
				}];
			}

			return [file, data]
		}))
	}

	function bufferToUint8Array(buffer: any) {
		const uint8Array = new Uint8Array(buffer.length);

		for (let i = 0; i < buffer.length; i++) {
			uint8Array[i] = buffer[i];
		}

		return uint8Array;
	}

	async function installDependencies() {
		// Install dependencies
		const installProcess = await webcontainerInstance.value!.spawn('pnpm', ['install']);

		installProcess.output.pipeTo(
			new WritableStream({
				write(data) {
					console.log(data)
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
