<?php


use Phinx\Migration\AbstractMigration;

class AddNavOverride extends AbstractMigration
{
    public function up()
    {
        $rolesTable = $this->table('directus_roles');
        $fieldsTable = $this->table('directus_fields');

        if (!$rolesTable->hasColumn('nav_override')) {
            $rolesTable->addColumn('nav_override', 'text', [
                'null' => true
            ]);

            $rolesTable->save();
        }

        $checkSql = 'SELECT 1 FROM `directus_fields` WHERE `field` = "nav_override" AND `collection` = "directus_roles";';
        $result = $this->query($checkSql)->fetch();

        if (!$result) {
            $fieldsTable->insert([
                'collection' => 'directus_roles',
                'field' => 'nav_override',
                'type' => 'json',
                'interface' => 'code',
                'options' => json_encode([
                    'template' => [
                        [
                            'title' => '$t:collections',
                            'include' => 'collections'
                        ],
                        [
                            'title' => '$t:bookmarks',
                            'include' => 'bookmarks'
                        ],
                        [
                            'title' => '$t:extensions',
                            'include' => 'extensions'
                        ],
                        [
                            'title' => 'Custom Links',
                            'links' => [
                                [
                                    'name' => 'RANGER Studio',
                                    'path' => 'https://rangerstudio.com',
                                    'icon' => 'star'
                                ],
                                [
                                    'name' => 'Movies',
                                    'path' => '/collections/movies'
                                ]
                            ]
                        ]
                    ]
                ]),
                'locked' => 1
            ]);

            $fieldsTable->save();
        }
    }
}
