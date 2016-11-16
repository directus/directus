<?php

namespace League\Flysystem\Adapter\Polyfill;

/**
 * A helper for adapters that only handle strings to provide read streams.
 */
trait StreamedReadingTrait
{
    /**
     * Reads a file as a stream.
     *
     * @param string $path
     *
     * @return array|false
     *
     * @see League\Flysystem\ReadInterface::readStream()
     */
    public function readStream($path)
    {
        if ( ! $data = $this->read($path)) {
            return false;
        }

        $stream = fopen('php://temp', 'w+b');
        fwrite($stream, $data['contents']);
        rewind($stream);
        $data['stream'] = $stream;
        unset($data['contents']);

        return $data;
    }

    /**
     * Reads a file.
     *
     * @param string $path
     *
     * @return array|false
     *
     * @see League\Flysystem\ReadInterface::read()
     */
    abstract public function read($path);
}
