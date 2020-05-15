<?php


use Phinx\Migration\AbstractMigration;

class AddFieldDisplay extends AbstractMigration
{
    public function change()
    {
        $fieldsTable = $this->table('directus_fields');

        if (!$this->checkFieldExist('directus_fields', 'display')) {
            $fieldsTable->addColumn('display', 'string', [
                'limit' => 64,
                'null' => true,
                'default' => null,
            ]);

            $fieldsTable->addColumn('display_options', 'text', [
                'null' => true,
                'default' => null
            ]);

            $fieldsTable->insert([
                [
                    'collection' => 'directus_fields',
                    'field' => 'display',
                    'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                    'interface' => 'text-input',
                    'locked' => 1
                ],
                [
                    'collection' => 'directus_fields',
                    'field' => 'display_options',
                    'type' => \Directus\Database\Schema\DataTypes::TYPE_JSON,
                    'interface' => 'json',
                    'locked' => 1
                ],
            ])->save();
        }

        $fieldsTable->save();
    }

    public function checkFieldExist($collection, $field)
    {
        $checkSql = sprintf('SELECT 1 FROM `directus_fields` WHERE `collection` = "%s" AND `field` = "%s";', $collection, $field);
        return $this->query($checkSql)->fetch();
    }

    public function hasSetting($field)
    {
        $checkSql = sprintf('SELECT 1 FROM `directus_settings` WHERE `key` = "%s"', $field);
        return $this->query($checkSql)->fetch();
    }
}
