<?php

use Phinx\Seed\AbstractSeed;

class SettingsSeeder extends AbstractSeed
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
        'key' => 'logo',
        'value' => ''
      ],
      [
        'key' => 'color',
        'value' => 'darkest-gray',
      ],
      [
        'key' => 'default_limit',
        'value' => '200'
      ],
      [
        'key' => 'sort_null_last',
        'value' => '1'
      ],
      [
        'key' => 'auto_sign_out',
        'value' => '60'
      ],
      [
        'key' => 'youtube_api_key',
        'value' => ''
      ],
      [
        'key' => 'trusted_proxies',
        'value' => ''
      ],
      [
        'key' => 'thumbnail_dimensions',
        'value' => '200x200'
      ],
      [
        'key' => 'thumbnail_quality_tags',
        'value' => '{"poor": 25, "good": 50, "better":  75, "best": 100}'
      ],
      [
        'key' => 'thumbnail_actions',
        'value' => '{"contain":{"options":{"resizeCanvas":false,"position":"center","resizeRelative":false,"canvasBackground":"ccc"}},"crop":{"options":{"position":"center"}}}'
      ],
      [
        'key' => 'thumbnail_cache_ttl',
        'value' => '86400'
      ],
      [
        'key' => 'thumbnail_not_found_location',
        'value' => ''
      ],
      [
        'key' => 'file_naming',
        'value' => 'uuid'
      ]
    ];

    $groups = $this->table('directus_settings');
    $groups->insert($data)->save();
  }
}
