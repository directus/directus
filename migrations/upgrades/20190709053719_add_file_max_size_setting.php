<?php


use Phinx\Migration\AbstractMigration;

class AddFileMaxSizeSetting extends AbstractMigration
{
    public function up()
    {
        $fieldObject = [
            'field' => 'file_max_size',
            'type' => 'string',
            'interface' => 'text-input',
            'options'   => json_encode(['placeholder' => 'i.e. 10KB or 10MB or 10GB']),
            'note' => 'i.e. 10KB ,10MB ,10GB.',
        ];
        $collection = 'directus_settings';

        $checkSql = sprintf('SELECT 1 FROM `directus_fields` WHERE `collection` = "%s" AND `field` = "%s";', $collection, $fieldObject['field']);
        $result = $this->query($checkSql)->fetch();

        if (!$result) {
            $insertSqlFormat = "INSERT INTO `directus_fields` (`collection`, `field`, `type`, `interface`,`options`,`note`) VALUES ('%s', '%s', '%s', '%s', '%s', '%s');";
            $insertSql = sprintf($insertSqlFormat, $collection, $fieldObject['field'], $fieldObject['type'], $fieldObject['interface'], $fieldObject['options'], $fieldObject['note']);
            $this->execute($insertSql);
        }

    }
}
