<?php

namespace Directus\Filesystem;

use Aws\S3\S3Client;
use League\Flysystem\Adapter\Local as LocalAdapter;
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
        $client = S3Client::factory([
            'credentials' => [
                'key' => $config['key'],
                'secret' => $config['secret'],
            ],
            'region' => $config['region'],
            'version' => ($config['version'] ?: 'latest'),
        ]);

        return new Flysystem(new S3Adapter($client, $config['bucket'], $config['root'] ?: null));
    }
}
