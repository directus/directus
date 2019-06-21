<?php

use Phinx\Seed\AbstractSeed;

class CollectionPresetsSeeder extends AbstractSeed
{
    /**
     * Run Method.
     *
     * Write your database seeder using this method.
     *
     * More information on writing seeders is available here:
     * http://docs.phinx.org/en/latest/seeding.html
     */
    public function run()
    {
        $data = [
            [
                'collection' => 'directus_activity',
                'view_type' => 'tabular',
                'view_type' => 'timeline',
                'view_query' => json_encode([
                    'timeline' => [
                      'sort' => '-action_on'
                    ]
                ]),
                'view_options' => json_encode([
                    'timeline' => [
                        'date' => 'action_on',
                        'title' => '{{ action_by.first_name }} {{ action_by.last_name }} ({{ action }})',
                        'content' => 'action_by',
                        'color' => 'action'
                    ]
                ])
            ],
            [
                'collection' => 'directus_files',
                'view_type' => 'cards',
                'view_options' => json_encode([
                    'cards' => [
                        'title' => 'title',
                        'subtitle' => 'type',
                        'content' => 'description',
                        'src' => 'data'
                    ]
                ])
            ],
            [
                'collection' => 'directus_users',
                'view_type' => 'cards',
                'view_options' => json_encode([
                    'cards' => [
                        'title' => 'first_name',
                        'subtitle' => 'last_name',
                        'content' => 'title',
                        'src' => 'avatar',
                        'icon' => 'person'
                    ]
                ])
            ]
        ];

        $files = $this->table('directus_collection_presets');
        $files->insert($data)->save();
    }
}
