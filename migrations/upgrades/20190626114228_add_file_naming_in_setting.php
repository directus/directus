<?php
use Phinx\Migration\AbstractMigration;
use function GuzzleHttp\json_encode;

class AddFileNamingInSetting extends AbstractMigration
{
  public function up()
  {
    $fieldObject = [
      'field' => 'file_naming',
      'type' => 'string',
      'interface' => 'dropdown',
      'options'   => ['choices' => ['uuid' => 'File Hash (Obfuscated)', 'file_name' => 'File Name (Readable)']]
    ];
    $collection = 'directus_settings';
    $checkSql = sprintf('SELECT 1 FROM `directus_fields` WHERE `collection` = "%s" AND `field` = "%s";', $collection, $fieldObject['field']);
    $result = $this->query($checkSql)->fetch();
    if (!$result) {
      $insertSqlFormat = "INSERT INTO `directus_fields` (`collection`, `field`, `type`, `interface`, `options`) VALUES ('%s', '%s', '%s', '%s' , '%s');";
      $insertSql = sprintf($insertSqlFormat, $collection, $fieldObject['field'], $fieldObject['type'], $fieldObject['interface'], json_encode($fieldObject['options']));
      $this->execute($insertSql);
    }
  }
}
