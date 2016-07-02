<?php

namespace League\Flysystem\Plugin;

class EmptyDir extends AbstractPlugin
{
    /**
     * Get the method name.
     *
     * @return string
     */
    public function getMethod()
    {
        return 'emptyDir';
    }

    /**
     * Empty a directory's contents.
     *
     * @param $dirname
     */
    public function handle($dirname)
    {
        $listing = $this->filesystem->listContents($dirname, false);

        foreach ($listing as $item) {
            if ($item['type'] === 'dir') {
                $this->filesystem->deleteDir($item['path']);
            } else {
                $this->filesystem->delete($item['path']);
            }
        }
    }
}
