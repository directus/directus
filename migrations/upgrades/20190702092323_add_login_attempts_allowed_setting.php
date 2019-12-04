<?php


use Phinx\Migration\AbstractMigration;

class AddLoginAttemptsAllowedSetting extends AbstractMigration
{
    public function up()
    {
        $fieldObject = [
            'field' => 'login_attempts_allowed',
            'type' => 'integer',
            'interface' => 'numeric',
        ];
        $collection = 'directus_settings';

        $checkSql = sprintf('SELECT 1 FROM `directus_fields` WHERE `collection` = "%s" AND `field` = "%s";', $collection, $fieldObject['field']);
        $result = $this->query($checkSql)->fetch();

        if (!$result) {
            $insertSqlFormat = 'INSERT INTO `directus_fields` (`collection`, `field`, `type`, `interface`) VALUES ("%s", "%s", "%s", "%s");';
            $insertSql = sprintf($insertSqlFormat, $collection, $fieldObject['field'], $fieldObject['type'], $fieldObject['interface']);
            $this->execute($insertSql);
        }

    }
}
