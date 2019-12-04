<?php

use Phinx\Migration\AbstractMigration;

class AddFileExtensionSetting extends AbstractMigration
{
    public function up()
    {
        $fieldObject = [
            'field' => 'file_mimetype_whitelist',
            'type' => 'array',
            'interface' => 'tags',
            'options'   => json_encode(['placeholder' => 'Type a file mimetype and then hit enter or comma.'])
        ];
        $collection = 'directus_settings';

        $checkSql = sprintf('SELECT 1 FROM `directus_fields` WHERE `collection` = "%s" AND `field` = "%s";', $collection, $fieldObject['field']);
        $result = $this->query($checkSql)->fetch();

        if (!$result) {
            $insertSqlFormat = "INSERT INTO `directus_fields` (`collection`, `field`, `type`, `interface`, `options`) VALUES ('%s', '%s', '%s', '%s', '%s');";
            $insertSql = sprintf($insertSqlFormat, $collection, $fieldObject['field'], $fieldObject['type'], $fieldObject['interface'],$fieldObject['options']);
            $this->execute($insertSql);
        }

    }

}
