<?php

return [
    'paths' => [
        'migrations' => '%%PHINX_CONFIG_DIR%%/../migrations/install'
    ],

    'version_order' => 'creation',

    'environments' => [
        'default_migration_table' => 'directus_migrations',
    ]
];
