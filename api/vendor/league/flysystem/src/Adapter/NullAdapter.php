<?php

namespace League\Flysystem\Adapter;

use League\Flysystem\Adapter\Polyfill\StreamedCopyTrait;
use League\Flysystem\Adapter\Polyfill\StreamedTrait;
use League\Flysystem\Config;

class NullAdapter extends AbstractAdapter
{
    use StreamedTrait;
    use StreamedCopyTrait;

    /**
     * Check whether a file is present.
     *
     * @param string $path
     *
     * @return bool
     */
    public function has($path)
    {
        return false;
    }

    /**
     * @inheritdoc
     */
    public function write($path, $contents, Config $config)
    {
        $type = 'file';
        $result = compact('contents', 'type', 'size', 'path');

        if ($visibility = $config->get('visibility')) {
            $result['visibility'] = $visibility;
        }

        return $result;
    }

    /**
     * @inheritdoc
     */
    public function update($path, $contents, Config $config)
    {
        return false;
    }

    /**
     * @inheritdoc
     */
    public function read($path)
    {
        return false;
    }

    /**
     * @inheritdoc
     */
    public function rename($path, $newpath)
    {
        return false;
    }

    /**
     * @inheritdoc
     */
    public function delete($path)
    {
        return false;
    }

    /**
     * @inheritdoc
     */
    public function listContents($directory = '', $recursive = false)
    {
        return [];
    }

    /**
     * @inheritdoc
     */
    public function getMetadata($path)
    {
        return false;
    }

    /**
     * @inheritdoc
     */
    public function getSize($path)
    {
        return false;
    }

    /**
     * @inheritdoc
     */
    public function getMimetype($path)
    {
        return false;
    }

    /**
     * @inheritdoc
     */
    public function getTimestamp($path)
    {
        return false;
    }

    /**
     * @inheritdoc
     */
    public function getVisibility($path)
    {
        return false;
    }

    /**
     * @inheritdoc
     */
    public function setVisibility($path, $visibility)
    {
        return compact('visibility');
    }

    /**
     * @inheritdoc
     */
    public function createDir($dirname, Config $config)
    {
        return ['path' => $dirname, 'type' => 'dir'];
    }

    /**
     * @inheritdoc
     */
    public function deleteDir($dirname)
    {
        return false;
    }
}
