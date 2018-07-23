<?php

namespace Directus\Filesystem\StorageAdapter;

abstract class AbstractStorageAdapter implements StorageAdapterInterface
{
    /** @var array */
    protected $config;

    /**
     * S3Adapter constructor.
     *
     * @param array $config
     */
    public function __construct(array $config)
    {
        $this->config = $config;
    }
}
