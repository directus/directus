<?php

return [
    'paths' => [
        'migrations' => '%%PHINX_CONFIG_DIR%%/../migrations/db/schemas',
        'seeds' => '%%PHINX_CONFIG_DIR%%/../migrations/db/seeds'
    ],

    'version_order' => 'creation',

    'environments' => [
        'default_migration_table' => 'directus_migrations',
    ]
];
