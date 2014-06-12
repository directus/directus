<?php

namespace Directus\Files\Storage\Adapter;

use Aws\S3\S3Client;
use Aws\S3\Enum\CannedAcl;

class AmazonS3Adapter extends Adapter {


    protected static $requiredClasses = array("\\Aws\\S3\\S3Client");

    protected static $requiredParams = array('api_key','api_secret');

    /**
     * @var \Aws\S3\S3Client;
     */
    protected $client;

    public function __construct(array $settings = array()) {
        parent::__construct($settings);
        $this->client = S3Client::factory(array(
            'key'    => $settings['params']['api_key'],
            'secret' => $settings['params']['api_secret']
        ));
    }

    protected function getObjectList() {
        $objects = array();
        $iterator = $this->client->getIterator('ListObjects', array(
            'Bucket' => $this->settings['destination']
        ));
        foreach ($iterator as $object) {
            $objects[$object['Key']] = $object;
        }
        return $objects;
    }

    public function getFileContents($fileName, $destination) {
        $result = $this->client->getObject(array(
            'Bucket' => $destination,
            'Key'    => $fileName
        ));
        return $result['Body'];
    }

    public function fileExists($fileName, $destination) {
        $objects = $this->getObjectList();
        return array_key_exists($fileName, $objects);
    }

    public function acceptFile($localFile, $targetFileName, $destination) {
      $this->writeFile($localFile, $targetFileName, $destination);
    }

    protected function writeFile($localFile, $targetFileName, $destination, $allowOverwrite = true) {
      if(!$allowOverwrite) {
        if($this->client->doesObjectExist($destination, $targetFileName)) {
          print_r("\nFile Already Uploaded!");
          return true;
        }
      }

      $acl = (1 == $this->settings['public']) ? CannedAcl::PUBLIC_READ : CannedAcl::PRIVATE_ACCESS;
      $finfo = new \finfo(FILEINFO_MIME_TYPE);
      $mimeType = $finfo->file($localFile);
      $result = $this->client->putObject(array(
          'Bucket'      => $destination,
          'Key'         => $targetFileName,
          'SourceFile'  => $localFile,
          'ACL'         => $acl,
          'ContentType' => $mimeType
      ));
      $this->client->waitUntilObjectExists(array(
          'Bucket'     => $destination,
          'Key'        => $targetFileName,
      ));
      return true;
    }

}
