<?php

namespace Directus\Filesystem\StorageAdapter;

use Google\Cloud\Storage\StorageClient;
use League\Flysystem\AdapterInterface;
use Superbalist\Flysystem\GoogleStorage\GoogleStorageAdapter;

class GcloudStorageAdapter extends AbstractStorageAdapter
{
    /**
     * @return AdapterInterface
     */
    public function getAdapter()
    {
        $client = $this->getGClodStorageClient();
        $bucket = $client->bucket($this->config['bucket']);

        return new GoogleStorageAdapter($client, $bucket, $this->config['root']);
    }

    /**
     * @return StorageClient
     */
    private function getGClodStorageClient()
    {
        $options = [
            'projectId' => $this->config['projectId'],
        ];

        if (isset($this->config['keyFilePath'])) {
            $options['keyFilePath'] = $this->config['keyFilePath'];
        }

        return new StorageClient($options);
    }

    /**
     * @return array
     */
    public function getConfig()
    {
        return [];
    }
}
