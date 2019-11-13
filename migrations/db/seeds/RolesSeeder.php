<?php

use Phinx\Seed\AbstractSeed;

class RolesSeeder extends AbstractSeed
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
                'id' => 1,
                'name' => 'Administrator',
                'description' => 'Admins have access to all managed data within the system by default'
            ],
            [
                'id' => 2,
                'name' => 'Public',
                'description' => 'Controls what API data is publicly available without authenticating'
            ]
        ];

        $groups = $this->table('directus_roles');
        $groups->insert($data)->save();
    }
}
