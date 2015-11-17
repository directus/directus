<?php

namespace League\Flysystem\Adapter\Polyfill;

trait StreamedReadingTrait
{
    /**
     * Get the contents of a file in a stream.
     *
     * @param string $path
     *
     * @return resource|false false when not found, or a resource
     */
    public function readStream($path)
    {
        if (! $data = $this->read($path)) {
            return false;
        }

        $stream = tmpfile();
        fwrite($stream, $data['contents']);
        rewind($stream);
        $data['stream'] = $stream;
        unset($data['contents']);

        return $data;
    }

    // Required abstract method

    /**
     * @param string $path
     *
     * @return resource
     */
    abstract public function read($path);
}
