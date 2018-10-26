<?php

return [
    'paths' => [
        'migrations' => '%%PHINX_CONFIG_DIR%%/../migrations/upgrades/schemas',
        'seeds' => '%%PHINX_CONFIG_DIR%%/../migrations/upgrades/seeds'
    ],

    'version_order' => 'creation',

    'environments' => [
        'default_migration_table' => 'directus_migrations',
    ]
];
