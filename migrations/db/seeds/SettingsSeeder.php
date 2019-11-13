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
        'key' => 'project_url',
        'value' => ''
      ],
      [
        'key' => 'project_logo',
        'value' => ''
      ],
      [
        'key' => 'project_color',
        'value' => 'blue-grey-900',
      ],
      [
        'key' => 'project_foreground',
        'value' => '',
      ],
      [
        'key' => 'project_background',
        'value' => '',
      ],
      [
        'key' => 'default_locale',
        'value' => 'en-US',
      ],
      [
        'key' => 'telemetry',
        'value' => '1',
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
        'key' => 'password_policy',
        'value' => ''
      ],
      [
        'key' => 'auto_sign_out',
        'value' => '10080'
      ],
      [
        'key' => 'login_attempts_allowed',
        'value' => '10'
      ],
      [
        'key' => 'trusted_proxies',
        'value' => ''
      ],
      [
        'key' => 'file_naming',
        'value' => 'uuid'
      ],
      [
        'key' => 'file_max_size',
        'value' => '100MB'
      ],
      [
        'key' => 'file_mimetype_whitelist',
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
        'key' => 'thumbnail_not_found_location',
        'value' => ''
      ],
      [
        'key' => 'thumbnail_cache_ttl',
        'value' => '86400'
      ],
      [
        'key' => 'youtube_api_key',
        'value' => ''
      ]
    ];

    $groups = $this->table('directus_settings');
    $groups->insert($data)->save();
  }
}
