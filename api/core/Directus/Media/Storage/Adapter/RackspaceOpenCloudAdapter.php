<?php

namespace Directus\Media\Storage\Adapter;

use OpenCloud\Rackspace;

class RackspaceOpenCloudAdapter extends Adapter {

    protected static $requiredParams = array('api_user','api_key','region','endpoint');

    /**
     * @var \OpenCloud\Rackspace
     */
    protected $conn;
    protected $ostore;
    protected $container;

    public function __construct(array $params = array()) {
        parent::__construct($params);
        if(!class_exists("\\OpenCloud\\Rackspace")) {
            throw new \RuntimeException("Missing dependency \\OpenCloud\\Rackspace");
        }
        $this->conn = new Rackspace($params['endpoint'], array(
            'username' => $params['api_user'],
            'apiKey' => $params['api_key']
        ));
        $this->conn->SetDefaults('ObjectStore', 'cloudFiles', $params['region']);
        try {
            $this->ostore = $this->conn->ObjectStore();
        } catch(\OpenCloud\Common\Exceptions\HttpError $e) {
            // @todo
            throw $e;
        }
    }

    protected function getObjectList() {
        $objects = array();
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
            $this->container = $this->ostore->Container($name);
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
