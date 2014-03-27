<?php

namespace Directus\Media\Storage\Adapter;

use Aws\S3\S3Client;

class AmazonS3Adapter extends Adapter {

    protected static $classDependencies = array("\\Aws\\S3\\S3Client");

    protected static $requiredParams = array('api_key','api_secret','bucket');

    /**
     * @var \Aws\S3\S3Client;
     */
    protected $client;

    public function __construct(array $params = array()) {
        parent::__construct($params);
        $this->client = S3Client::factory(array(
            'key'    => $params['api_key'],
            'secret' => $params['api_secret']
        ));
    }

    protected function getObjectList() {
        $objects = array();
        $iterator = $client->getIterator('ListObjects', array(
            'Bucket' => $this->params['bucket']
        ));
        foreach ($iterator as $object) {
            var_dump($object);
            $objects[] = $object['Key'];
        }
        exit;
        $list = $this->container->ObjectList();
        while ($item = $list->Next()) {
            $objects[$item->name] = array(
                'content_type' => $item->content_type,
                'bytes' => $item->bytes,
                'cdn-url' => $item->PublicUrl()
            );
        }
        return $objects;
    }

    protected function setContainer($name) {
        if(is_null($this->container) || $name !== $this->container->name) {
            try {
                $this->container = $this->ostore->Container($name);
            } catch(\OpenCloud\Common\Exceptions\HttpError $e) {
                // @todo
                throw $e;
            }
        }
    }

    protected function fileExists($fileName, $destination) {
        $this->setContainer($destination);
        $objects = $this->getObjectList();
        return array_key_exists($fileName, $objects);
    }

    protected function writeFile($localFile, $targetFileName, $destination) {
        $this->setContainer($destination);
        try {
            $object = $this->container->DataObject();
            $object->name = $targetFileName;
            $object->SetData(file_get_contents($localFile));
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $object->content_type = finfo_file($finfo, $localFile);
            $object->Create();
            return true;
        } catch (Exception $e) {
            return false;
        }
    }

}
