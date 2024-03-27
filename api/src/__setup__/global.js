// From https://sharp.pixelplumbing.com/install#worker-threads:
// On some platforms, including glibc-based Linux, the main thread must call require('sharp') before worker threads are created.
// This is to ensure shared libraries remain loaded in memory until after all threads are complete.
// Without this, the following error may occur: Module did not self-register
import 'sharp';
import 'isolated-vm';

export default function () {}
