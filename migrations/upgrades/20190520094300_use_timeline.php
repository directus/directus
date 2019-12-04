<?php

use Phinx\Migration\AbstractMigration;

class UseTimeline extends AbstractMigration
{
    public function up()
    {
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_collection_presets',
            [
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
            ['collection' => 'directus_activity']
        ));
    }
}
