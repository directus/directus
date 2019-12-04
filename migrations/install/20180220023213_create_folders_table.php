<?php

use Phinx\Migration\AbstractMigration;

class CreateFoldersTable extends AbstractMigration
{
    /**
     * Create Folders Table
     */
    public function change()
    {
        $table = $this->table('directus_folders', ['signed' => false]);

        $table->addColumn('name', 'string', [
            'limit' => 191,
            'null' => false,
            'encoding' => 'utf8mb4'
        ]);
        $table->addColumn('parent_folder', 'integer', [
            'signed' => false,
            'null' => true,
            'default' => null
        ]);

        $table->addIndex(['name', 'parent_folder'], [
            'unique' => true,
            'name' => 'idx_name_parent_folder'
        ]);

        $table->create();
        $data = [
            [
                'collection' => 'directus_folders',
                'field' => 'id',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'primary-key',
                'locked' => 1,
                'required' => 1,
                'hidden_detail' => 1
            ],
            [
                'collection' => 'directus_folders',
                'field' => 'name',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1
            ],
            [
                'collection' => 'directus_folders',
                'field' => 'parent_folder',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_M2O,
                'interface' => 'many-to-one',
                'locked' => 1
            ],
        ];

        foreach($data as $value){
            if(!$this->checkFieldExist($value['collection'], $value['field'])){
                $fileds = $this->table('directus_fields');
                $fileds->insert($value)->save();
            }
        }
    }

    public function checkFieldExist($collection,$field){
        $checkSql = sprintf('SELECT 1 FROM `directus_fields` WHERE `collection` = "%s" AND `field` = "%s";', $collection, $field);
        return $this->query($checkSql)->fetch();
    }
}
