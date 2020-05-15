<?php


use Phinx\Migration\AbstractMigration;

class AddDisplaytemplate extends AbstractMigration
{
    public function change()
    {
        $collectionsTable = $this->table('directus_collections');
        $fieldsTable = $this->table('directus_fields');

        if (!$this->checkFieldExist('directus_collections', 'display_template')) {
            $collectionsTable->addColumn('display_template', 'string', [
                'limit' => 255,
                'null' => true,
                'default' => null,
            ]);

            $fieldsTable->insert([
                [
                    'collection' => 'directus_collections',
                    'field' => 'display_template',
                    'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                    'interface' => 'text-input',
                    'locked' => 1,
                    'sort' => 3,
                    'width' => 'full',
                    'note' => 'What template to use to reference individual items in this collection.',
                    'options' => json_encode([
                        'placeholder' => '{{ name }} – ({{ title }})'
                    ])
                ],
            ])->save();
        }

        $fieldsTable->save();
        $collectionsTable->save();
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
