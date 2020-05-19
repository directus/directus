<?php

use Phinx\Migration\AbstractMigration;

class AddAuthTtlField extends AbstractMigration
{
    public function up()
    {
        $settings = [
            'auth_token_ttl' => [
                // for directus_fields
                'type' => 'integer',
                'interface' => 'numeric',
                'options' => '{\"iconRight\":\"timer\"}',
                // 'locked' => 1,
                // 'validation' => null,
                'required' => 1,
                // 'readonly' => 0,
                // 'hidden_detail' => 0,
                // 'hidden_browse' => 0,
                'sort' => 25,
                'width' => 'half',
                // 'height' => null,
                // 'group' => null,
                'note' => 'How long the API authorization token will last',
                // 'translation' => null,

                // for directus_settings
                'value' => 20,
            ]
        ];
        foreach ($settings as $field => $options) {
            $this->addSetting($field, $options['value']);
            $this->addField($field, $options['type'], $options['interface'], $options['options'], $options['required'], $options['sort'], $options['width'], $options['note']);
        }
    }

    protected function addField($field, $type, $interface, $options, $required, $sort, $width, $note)
    {
        $collection = 'directus_settings';
        $checkSql = sprintf('SELECT 1 FROM `directus_fields` WHERE `collection` = "%s" AND `field` = "%s";', $collection, $field);
        $result = $this->query($checkSql)->fetch();
        if (!$result)
        {
            $insertSqlFormat = 'INSERT INTO `directus_fields` (`collection`, `field`, `type`, `interface`, `options`, `required`, `sort`, `width`, `note`) VALUES ("%s", "%s", "%s", "%s", "%s","%s", "%s", "%s", "%s")';
            $insertSql = sprintf($insertSqlFormat, $collection, $field, $type, $interface, $options, $required, $sort, $width, $note);
            $res = $this->execute($insertSql);
        }
    }

    protected function addSetting($key, $value)
    {
        $checkSql = sprintf('SELECT 1 FROM `directus_settings` WHERE `key` = "%s"', $key);
        $result = $this->query($checkSql)->fetch();
        if (!$result)
        {
            $insertSqlFormat = 'INSERT INTO `directus_settings` (`key`, `value`) VALUES ("%s", "%s")';
            $insertSql = sprintf($insertSqlFormat, $key, $value);
            $res = $this->execute($insertSql);
        }
    }

    public function down()
    {
        $this->execute("DELETE FROM directus_settings where `key`='auth_token_ttl'");
        $this->execute("DELETE FROM directus_fields where collection='directus_settings' and field='auth_token_ttl'");
    }

}
