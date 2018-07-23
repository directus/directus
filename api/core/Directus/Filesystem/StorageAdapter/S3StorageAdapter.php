<?php

namespace Directus\Filesystem\StorageAdapter;

use Aws\S3\S3Client;
use Directus\Util\ArrayUtils;
use League\Flysystem\AdapterInterface;
use League\Flysystem\AwsS3v3\AwsS3Adapter;

class S3StorageAdapter extends AbstractStorageAdapter
{
    /**
     * @return AdapterInterface
     */
    public function getAdapter()
    {
        return new AwsS3Adapter($this->getS3Client(), $this->config['bucket'], $this->config['root'] ?: null);
    }

    /**
     * @return S3Client
     */
    private function getS3Client()
    {
        $options = [
            'credentials' => [
                'key' => $this->config['key'],
                'secret' => $this->config['secret'],
            ],
            'region' => $this->config['region'],
            'version' => $this->config['version'] ?: 'latest',
        ];

        if (isset($this->config['endpoint'])) {
            $this->config['endpoint'] = ArrayUtils::get($this->config, 'endpoint');
        }

        return new S3Client($options);
    }

    /**
     * @return array
     */
    public function getConfig()
    {
        return [
            'visibility' => ArrayUtils::get($this->config, 'visibility', AdapterInterface::VISIBILITY_PUBLIC)
        ];
    }
}
