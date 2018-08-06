<?php

use Directus\Filesystem\FilesystemFactory;
use League\Flysystem\FilesystemInterface;

class FilesystemFactoryTest extends PHPUnit_Framework_TestCase
{
    /**
     * @dataProvider configDataProvider
     */
    public function testCreateAdapter($config)
    {
        $adapter = FilesystemFactory::createAdapter($config);

        $this->assertInstanceOf(FilesystemInterface::class, $adapter);
    }

    public function configDataProvider()
    {
        return [
            [['adapter' => 'local', 'root' => '']],
            [['adapter' => 's3', 'root' => '', 'key' => '', 'secret' => '', 'region' => '', 'version' => '', 'bucket' => '']],
            [['adapter' => 'non_existant', 'root' => '']],
            [['adapter' => 'gcloud', 'projectId' => '', 'bucket' => '', 'keyFilePath' => '']],
        ];
    }
}
