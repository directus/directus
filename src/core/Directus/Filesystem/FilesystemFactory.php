<?php

namespace Directus\Filesystem;

use OSS\OssClient;
use OSS\Core\OssException;
use Aws\S3\S3Client;
use MicrosoftAzure\Storage\Blob\BlobRestProxy;
use Directus\Application\Application;
use function Directus\array_get;
use function Directus\array_pick;
use Aliyun\Flysystem\AliyunOss\Plugins\PutFile;
use Aliyun\Flysystem\AliyunOss\AliyunOssAdapter;
use League\Flysystem\Adapter\Local as LocalAdapter;
use League\Flysystem\AwsS3v3\AwsS3Adapter as S3Adapter;
use League\Flysystem\AzureBlobStorage\AzureBlobStorageAdapter as AzureAdapter;
use League\Flysystem\Filesystem as Flysystem;

class FilesystemFactory
{
    public static function createAdapter(Array $config, $rootKey = 'root')
    {
        // @TODO: This need to be more dynamic
        // As the app get more organized this will too
        switch ($config['adapter']) {
            case 'aliyun-oss':
                return self::createAliyunOSSAdapter($config, $rootKey);
                break;
            case 's3':
                return self::createS3Adapter($config, $rootKey);
                break;
            case 'azure':
                return self::createAzureAdapter($config, $rootKey);
                break;
            case 'local':
            default:
                return self::createLocalAdapter($config, $rootKey);
        }
    }

    public static function createLocalAdapter(Array $config, $rootKey = 'root')
    {
        $root = array_get($config, $rootKey, '');
        // hotfix: set the full path if it's a relative path
        // also root must be required, not checked here
        if (strpos($root, '/') !== 0) {
            $app = Application::getInstance();
            $root = $app->getContainer()->get('path_base') . '/' . $root;
        }

        $root = $root ?: '/';

        return new Flysystem(new LocalAdapter($root));
    }

    public static function createAzureAdapter(Array $config, $rootKey = 'root')
    {
        if (!array_key_exists('azure_connection_string', $config)) {
            throw new \InvalidArgumentException('Filesystem: Azure adapter missing connection string');
        } else if (!array_key_exists('azure_container', $config)) {
            throw new \InvalidArgumentException('Filesystem: Azure adapter missing container name');
        }
        $client = BlobRestProxy::createBlobService($config['azure_connection_string']);
        return new Flysystem(new AzureAdapter($client, $config['azure_container']));
    }

    public static function createS3Adapter(Array $config, $rootKey = 'root')
    {
        $options = [
            'region' => $config['region'],
            'version' => ($config['version'] ?: 'latest'),
        ];

        if (isset($config['key'])) {
            if (!array_key_exists('secret', $config)) {
                throw new \InvalidArgumentException('Filesystem: S3 Adapter missing secret key');
            }

            $options['credentials'] = array_pick($config, ['key', 'secret']);
        }

        if (isset($config['endpoint']) && $config['endpoint']) {
          $options['endpoint'] = $config['endpoint'];
          $options['use_path_style_endpoint'] = true;
        }

        $client = S3Client::factory($options);
        $options = array_get($config, 'options', []);

        return new Flysystem(new S3Adapter($client, $config['bucket'], array_get($config, $rootKey), $options));
    }

    public static function createAliyunOSSAdapter(Array $config, $rootKey = 'root')
    {
       try {
            $ossClient = new OssClient($config['OSS_ACCESS_ID'], $config['OSS_ACCESS_KEY'], $config['OSS_ENDPOINT'], false);
        } catch (OssException $e) {
            $app = Application::getInstance();
            $app->getContainer()->get('logger')->error($e->getMessage());
            throw new \InvalidArgumentException("creating OssClient instance: FAILED");
        }

        $adapter = new AliyunOssAdapter($ossClient, $config['OSS_BUCKET']);
        $adapter->setPathPrefix(array_get($config, $rootKey));

        $flysystem = new Flysystem($adapter);
        $flysystem->addPlugin(new PutFile());

        return $flysystem;
    }
}
