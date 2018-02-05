<?php

namespace Directus\Filesystem;

use Aws\S3\S3Client;
use Directus\Util\ArrayUtils;
use League\Flysystem\Adapter\Local as LocalAdapter;
use League\Flysystem\AdapterInterface;
use League\Flysystem\AwsS3v3\AwsS3Adapter as S3Adapter;
use League\Flysystem\Filesystem as Flysystem;

class FilesystemFactory
{
    public static function createAdapter(Array $config)
    {
        // @TODO: This need to be more dynamic
        // As the app get more organized this will too
        switch ($config['adapter']) {
            case 's3':
                return self::createS3Adapter($config);
                break;
            case 'local':
            default:
                return self::createLocalAdapter($config);
        }
    }

    public static function createLocalAdapter(Array $config)
    {
        $root = $config['root'] ?: '/';
        return new Flysystem(new LocalAdapter($root));
    }

    public static function createS3Adapter(Array $config)
    {
        $options = [
            'credentials' => [
                'key' => $config['key'],
                'secret' => $config['secret'],
            ],
            'region' => $config['region'],
            'version' => ($config['version'] ?: 'latest')
        ];

        // Make sure the endpoint was set by the user before trying to use it
        // This will result in a error for S3.
        // This is meant for Digital Ocean Spaces
        if (isset($config['endpoint'])) {
            $options['endpoint'] = ArrayUtils::get($config, 'endpoint');
        }

        $client = S3Client::factory($options);
        $adapter = new S3Adapter($client, $config['bucket'], $config['root'] ?: null);

        return new Flysystem($adapter, [
            'visibility' => ArrayUtils::get($config, 'visibility', AdapterInterface::VISIBILITY_PUBLIC)
        ]);
    }
}
