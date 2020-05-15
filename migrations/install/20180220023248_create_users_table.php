<?php

use Phinx\Migration\AbstractMigration;

class CreateUsersTable extends AbstractMigration
{
    /**
     * Create Users Table
     */
    public function change()
    {
        $table = $this->table('directus_users', ['signed' => false]);

        $table->addColumn('status', 'string', [
            'limit' => 16,
            'default' => \Directus\Database\TableGateway\DirectusUsersTableGateway::STATUS_DRAFT
        ]);
        $table->addColumn('role', 'integer', [
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('first_name', 'string', [
            'limit' => 50,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('last_name', 'string', [
            'limit' => 50,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('email', 'string', [
            'limit' => 128,
            'null' => false
        ]);
        $table->addColumn('password', 'string', [
            'limit' => 255,
            'encoding' => 'utf8',
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('token', 'string', [
            'limit' => 255,
            'encoding' => 'utf8',
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('timezone', 'string', [
            'limit' => 32,
            'default' => date_default_timezone_get(),
        ]);
        $table->addColumn('locale', 'string', [
            'limit' => 8,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('locale_options', 'text', [
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('avatar', 'integer', [
            'signed' => false,
            'limit' => 11,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('company', 'string', [
            'limit' => 191,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('title', 'string', [
            'limit' => 191,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('email_notifications', 'integer', [
            'limit' => 1,
            'default' => 1
        ]);
        $table->addColumn('last_access_on', 'datetime', [
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('last_page', 'string', [
            'limit' => 192,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('external_id', 'string', [
            'limit' => 255,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('theme', 'string', [
            'limit' => 100,
            'encoding' => 'utf8',
            'null' => true,
            'default' => 'auto'
        ]);
        $table->addColumn('2fa_secret', 'string', [
            'limit' => 100,
            'encoding' => 'utf8',
            'null' => true,
            'default' => null
        ]);

        $table->addColumn('password_reset_token', 'string', [
            'limit' => 520,
            'encoding' => 'utf8',
            'null' => true,
            'default' => null
        ]);

        $table->addIndex('email', [
            'unique' => true,
            'name' => 'idx_users_email'
        ]);

        $table->addIndex('token', [
            'unique' => true,
            'name' => 'idx_users_token'
        ]);

        $table->addIndex('external_id', [
            'unique' => true,
            'name' => 'idx_users_external_id'
        ]);

        $table->create();

        $data = [
            [
                'collection' => 'directus_users',
                'field' => 'id',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'primary-key',
                'locked' => 1,
                'required' => 1,
                'hidden_detail' => 1,
                'sort' => 1
            ],
            [
                'collection' => 'directus_users',
                'field' => 'status',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STATUS,
                'interface' => 'status',
                'options' => json_encode([
                    'status_mapping' => [
                        'draft' => [
                            'name' => 'Draft',
                            'text_color' => 'white',
                            'background_color' => 'light-gray',
                            'listing_subdued' => false,
                            'listing_badge' => true,
                            'soft_delete' => false,
                        ],
                        'invited' => [
                            'name' => 'Invited',
                            'text_color' => 'white',
                            'background_color' => 'light-gray',
                            'listing_subdued' => false,
                            'listing_badge' => true,
                            'soft_delete' => false,
                        ],
                        'active' => [
                            'name' => 'Active',
                            'text_color' => 'white',
                            'background_color' => 'success',
                            'listing_subdued' => false,
                            'listing_badge' => false,
                            'soft_delete' => false,
                        ],
                        'suspended' => [
                            'name' => 'Suspended',
                            'text_color' => 'white',
                            'background_color' => 'light-gray',
                            'listing_subdued' => false,
                            'listing_badge' => true,
                            'soft_delete' => false,
                        ],
                        'deleted' => [
                            'name' => 'Deleted',
                            'text_color' => 'white',
                            'background_color' => 'danger',
                            'listing_subdued' => false,
                            'listing_badge' => true,
                            'soft_delete' => true,
                        ]
                    ]
                ]),
                'locked' => 1,
                'sort' => 2,
                'required' => 1
            ],
            [
                'collection' => 'directus_users',
                'field' => 'first_name',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'options' => json_encode([
                    'iconRight' => 'account_circle'
                ]),
                'locked' => 1,
                'required' => 1,
                'sort' => 3,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_users',
                'field' => 'last_name',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'options' => json_encode([
                    'iconRight' => 'account_circle'
                ]),
                'locked' => 1,
                'required' => 1,
                'sort' => 4,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_users',
                'field' => 'email',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'options' => json_encode([
                    'iconRight' => 'alternate_email'
                ]),
                'locked' => 1,
                'validation' => '$email',
                'required' => 1,
                'sort' => 5,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_users',
                'field' => 'email_notifications',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_BOOLEAN,
                'interface' => 'switch',
                'locked' => 1,
                'sort' => 6,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_users',
                'field' => 'password',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_HASH,
                'interface' => 'password',
                'locked' => 1,
                'required' => 1,
                'sort' => 7,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_users',
                'field' => 'role',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_M2O,
                'interface' => 'user-roles',
                'locked' => 1,
                'sort' => 8,
                'width' => 'half',
                'required' => 1
            ],
            [
                'collection' => 'directus_users',
                'field' => 'company',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'options' => json_encode([
                    'iconRight' => 'location_city'
                ]),
                'sort' => 9,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_users',
                'field' => 'title',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'options' => json_encode([
                    'iconRight' => 'text_fields'
                ]),
                'sort' => 10,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_users',
                'field' => 'timezone',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'dropdown',
                'options' => json_encode([
                    'choices' => [
                        'Pacific/Midway' => '(UTC-11:00) Midway Island',
                        'Pacific/Samoa' => '(UTC-11:00) Samoa',
                        'Pacific/Honolulu' => '(UTC-10:00) Hawaii',
                        'US/Alaska' => '(UTC-09:00) Alaska',
                        'America/Los_Angeles' => '(UTC-08:00) Pacific Time (US & Canada)',
                        'America/Tijuana' => '(UTC-08:00) Tijuana',
                        'US/Arizona' => '(UTC-07:00) Arizona',
                        'America/Chihuahua' => '(UTC-07:00) Chihuahua',
                        'America/Mexico/La_Paz' => '(UTC-07:00) La Paz',
                        'America/Mazatlan' => '(UTC-07:00) Mazatlan',
                        'US/Mountain' => '(UTC-07:00) Mountain Time (US & Canada)',
                        'America/Managua' => '(UTC-06:00) Central America',
                        'US/Central' => '(UTC-06:00) Central Time (US & Canada)',
                        'America/Guadalajara' => '(UTC-06:00) Guadalajara',
                        'America/Mexico_City' => '(UTC-06:00) Mexico City',
                        'America/Monterrey' => '(UTC-06:00) Monterrey',
                        'Canada/Saskatchewan' => '(UTC-06:00) Saskatchewan',
                        'America/Bogota' => '(UTC-05:00) Bogota',
                        'US/Eastern' => '(UTC-05:00) Eastern Time (US & Canada)',
                        'US/East-Indiana' => '(UTC-05:00) Indiana (East)',
                        'America/Lima' => '(UTC-05:00) Lima',
                        'America/Quito' => '(UTC-05:00) Quito',
                        'Canada/Atlantic' => '(UTC-04:00) Atlantic Time (Canada)',
                        'America/New_York' => '(UTC-04:00) New York',
                        'America/Caracas' => '(UTC-04:30) Caracas',
                        'America/La_Paz' => '(UTC-04:00) La Paz',
                        'America/Santiago' => '(UTC-04:00) Santiago',
                        'America/Santo_Domingo' => '(UTC-04:00) Santo Domingo',
                        'Canada/Newfoundland' => '(UTC-03:30) Newfoundland',
                        'America/Sao_Paulo' => '(UTC-03:00) Brasilia',
                        'America/Argentina/Buenos_Aires' => '(UTC-03:00) Buenos Aires',
                        'America/Argentina/GeorgeTown' => '(UTC-03:00) Georgetown',
                        'America/Godthab' => '(UTC-03:00) Greenland',
                        'America/Noronha' => '(UTC-02:00) Mid-Atlantic',
                        'Atlantic/Azores' => '(UTC-01:00) Azores',
                        'Atlantic/Cape_Verde' => '(UTC-01:00) Cape Verde Is.',
                        'Africa/Casablanca' => '(UTC+00:00) Casablanca',
                        'Europe/Edinburgh' => '(UTC+00:00) Edinburgh',
                        'Etc/Greenwich' => '(UTC+00:00) Greenwich Mean Time : Dublin',
                        'Europe/Lisbon' => '(UTC+00:00) Lisbon',
                        'Europe/London' => '(UTC+00:00) London',
                        'Africa/Monrovia' => '(UTC+00:00) Monrovia',
                        'UTC' => '(UTC+00:00) UTC',
                        'Europe/Amsterdam' => '(UTC+01:00) Amsterdam',
                        'Europe/Belgrade' => '(UTC+01:00) Belgrade',
                        'Europe/Berlin' => '(UTC+01:00) Berlin',
                        'Europe/Bern' => '(UTC+01:00) Bern',
                        'Europe/Bratislava' => '(UTC+01:00) Bratislava',
                        'Europe/Brussels' => '(UTC+01:00) Brussels',
                        'Europe/Budapest' => '(UTC+01:00) Budapest',
                        'Europe/Copenhagen' => '(UTC+01:00) Copenhagen',
                        'Europe/Ljubljana' => '(UTC+01:00) Ljubljana',
                        'Europe/Madrid' => '(UTC+01:00) Madrid',
                        'Europe/Paris' => '(UTC+01:00) Paris',
                        'Europe/Prague' => '(UTC+01:00) Prague',
                        'Europe/Rome' => '(UTC+01:00) Rome',
                        'Europe/Sarajevo' => '(UTC+01:00) Sarajevo',
                        'Europe/Skopje' => '(UTC+01:00) Skopje',
                        'Europe/Stockholm' => '(UTC+01:00) Stockholm',
                        'Europe/Vienna' => '(UTC+01:00) Vienna',
                        'Europe/Warsaw' => '(UTC+01:00) Warsaw',
                        'Africa/Lagos' => '(UTC+01:00) West Central Africa',
                        'Europe/Zagreb' => '(UTC+01:00) Zagreb',
                        'Europe/Athens' => '(UTC+02:00) Athens',
                        'Europe/Bucharest' => '(UTC+02:00) Bucharest',
                        'Africa/Cairo' => '(UTC+02:00) Cairo',
                        'Africa/Harare' => '(UTC+02:00) Harare',
                        'Europe/Helsinki' => '(UTC+02:00) Helsinki',
                        'Europe/Istanbul' => '(UTC+02:00) Istanbul',
                        'Asia/Jerusalem' => '(UTC+02:00) Jerusalem',
                        'Europe/Kyiv' => '(UTC+02:00) Kyiv',
                        'Africa/Johannesburg' => '(UTC+02:00) Pretoria',
                        'Europe/Riga' => '(UTC+02:00) Riga',
                        'Europe/Sofia' => '(UTC+02:00) Sofia',
                        'Europe/Tallinn' => '(UTC+02:00) Tallinn',
                        'Europe/Vilnius' => '(UTC+02:00) Vilnius',
                        'Asia/Baghdad' => '(UTC+03:00) Baghdad',
                        'Asia/Kuwait' => '(UTC+03:00) Kuwait',
                        'Europe/Minsk' => '(UTC+03:00) Minsk',
                        'Africa/Nairobi' => '(UTC+03:00) Nairobi',
                        'Asia/Riyadh' => '(UTC+03:00) Riyadh',
                        'Europe/Volgograd' => '(UTC+03:00) Volgograd',
                        'Asia/Tehran' => '(UTC+03:30) Tehran',
                        'Asia/Abu_Dhabi' => '(UTC+04:00) Abu Dhabi',
                        'Asia/Baku' => '(UTC+04:00) Baku',
                        'Europe/Moscow' => '(UTC+04:00) Moscow',
                        'Asia/Muscat' => '(UTC+04:00) Muscat',
                        'Europe/St_Petersburg' => '(UTC+04:00) St. Petersburg',
                        'Asia/Tbilisi' => '(UTC+04:00) Tbilisi',
                        'Asia/Yerevan' => '(UTC+04:00) Yerevan',
                        'Asia/Kabul' => '(UTC+04:30) Kabul',
                        'Asia/Islamabad' => '(UTC+05:00) Islamabad',
                        'Asia/Karachi' => '(UTC+05:00) Karachi',
                        'Asia/Tashkent' => '(UTC+05:00) Tashkent',
                        'Asia/Calcutta' => '(UTC+05:30) Chennai',
                        'Asia/Kolkata' => '(UTC+05:30) Kolkata',
                        'Asia/Mumbai' => '(UTC+05:30) Mumbai',
                        'Asia/New_Delhi' => '(UTC+05:30) New Delhi',
                        'Asia/Sri_Jayawardenepura' => '(UTC+05:30) Sri Jayawardenepura',
                        'Asia/Katmandu' => '(UTC+05:45) Kathmandu',
                        'Asia/Almaty' => '(UTC+06:00) Almaty',
                        'Asia/Astana' => '(UTC+06:00) Astana',
                        'Asia/Dhaka' => '(UTC+06:00) Dhaka',
                        'Asia/Yekaterinburg' => '(UTC+06:00) Ekaterinburg',
                        'Asia/Rangoon' => '(UTC+06:30) Rangoon',
                        'Asia/Bangkok' => '(UTC+07:00) Bangkok',
                        'Asia/Hanoi' => '(UTC+07:00) Hanoi',
                        'Asia/Jakarta' => '(UTC+07:00) Jakarta',
                        'Asia/Novosibirsk' => '(UTC+07:00) Novosibirsk',
                        'Asia/Beijing' => '(UTC+08:00) Beijing',
                        'Asia/Chongqing' => '(UTC+08:00) Chongqing',
                        'Asia/Hong_Kong' => '(UTC+08:00) Hong Kong',
                        'Asia/Krasnoyarsk' => '(UTC+08:00) Krasnoyarsk',
                        'Asia/Kuala_Lumpur' => '(UTC+08:00) Kuala Lumpur',
                        'Australia/Perth' => '(UTC+08:00) Perth',
                        'Asia/Singapore' => '(UTC+08:00) Singapore',
                        'Asia/Taipei' => '(UTC+08:00) Taipei',
                        'Asia/Ulan_Bator' => '(UTC+08:00) Ulaan Bataar',
                        'Asia/Urumqi' => '(UTC+08:00) Urumqi',
                        'Asia/Irkutsk' => '(UTC+09:00) Irkutsk',
                        'Asia/Osaka' => '(UTC+09:00) Osaka',
                        'Asia/Sapporo' => '(UTC+09:00) Sapporo',
                        'Asia/Seoul' => '(UTC+09:00) Seoul',
                        'Asia/Tokyo' => '(UTC+09:00) Tokyo',
                        'Australia/Adelaide' => '(UTC+09:30) Adelaide',
                        'Australia/Darwin' => '(UTC+09:30) Darwin',
                        'Australia/Brisbane' => '(UTC+10:00) Brisbane',
                        'Australia/Canberra' => '(UTC+10:00) Canberra',
                        'Pacific/Guam' => '(UTC+10:00) Guam',
                        'Australia/Hobart' => '(UTC+10:00) Hobart',
                        'Australia/Melbourne' => '(UTC+10:00) Melbourne',
                        'Pacific/Port_Moresby' => '(UTC+10:00) Port Moresby',
                        'Australia/Sydney' => '(UTC+10:00) Sydney',
                        'Asia/Yakutsk' => '(UTC+10:00) Yakutsk',
                        'Asia/Vladivostok' => '(UTC+11:00) Vladivostok',
                        'Pacific/Auckland' => '(UTC+12:00) Auckland',
                        'Pacific/Fiji' => '(UTC+12:00) Fiji',
                        'Pacific/Kwajalein' => '(UTC+12:00) International Date Line West',
                        'Asia/Kamchatka' => '(UTC+12:00) Kamchatka',
                        'Asia/Magadan' => '(UTC+12:00) Magadan',
                        'Pacific/Marshall_Is' => '(UTC+12:00) Marshall Is.',
                        'Asia/New_Caledonia' => '(UTC+12:00) New Caledonia',
                        'Asia/Solomon_Is' => '(UTC+12:00) Solomon Is.',
                        'Pacific/Wellington' => '(UTC+12:00) Wellington',
                        'Pacific/Tongatapu' => '(UTC+13:00) Nuku\'alofa'
                    ],
                    'placeholder' => 'Choose a timezone...'
                ]),
                'locked' => 1,
                'sort' => 11,
                'width' => 'half',
                'required' => 1
            ],
            [
                'collection' => 'directus_users',
                'field' => 'locale',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'language',
                'options' => json_encode([
                    'limit' => true
                ]),
                'locked' => 1,
                'sort' => 12,
                'width' => 'half',
                'required' => 0
            ],
            [
                'collection' => 'directus_users',
                'field' => 'avatar',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_FILE,
                'interface' => 'file',
                'locked' => 1,
                'sort' => 13
            ],
            [
                'collection' => 'directus_users',
                'field' => 'theme',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'radio-buttons',
                'options' => json_encode([
                    'format' => true,
                    'choices' => [
                        'auto' => 'Auto',
                        'light' => 'Light',
                        'dark' => 'Dark'
                    ]
                ]),
                'locked' => 1,
                'readonly' => 0,
                'sort' => 14
            ],
            [
                'collection' => 'directus_users',
                'field' => '2fa_secret',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => '2fa-secret',
                'locked' => 1,
                'readonly' => 1,
                'sort' => 15
            ],
            [
                'collection' => 'directus_users',
                'field' => 'locale_options',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_JSON,
                'interface' => 'json',
                'locked' => 1,
                'hidden_browse' => 1,
                'hidden_detail' => 1,
                'sort' => 16
            ],
            [
                'collection' => 'directus_users',
                'field' => 'token',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'hidden_detail' => 1,
                'hidden_browse' => 1,
                'sort' => 17
            ],
            [
                'collection' => 'directus_users',
                'field' => 'last_access_on',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_DATETIME,
                'interface' => 'datetime',
                'locked' => 1,
                'readonly' => 1,
                'hidden_detail' => 1,
                'sort' => 18
            ],

            [
                'collection' => 'directus_users',
                'field' => 'last_page',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'readonly' => 1,
                'hidden_detail' => 1,
                'hidden_browse' => 1,
                'sort' => 19
            ],
            [
                'collection' => 'directus_users',
                'field' => 'external_id',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'readonly' => 1,
                'hidden_detail' => 1,
                'hidden_browse' => 1
            ],
            [
                'collection' => 'directus_users',
                'field' => 'password_reset_token',
                'type' =>  \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'readonly' => 1,
                'hidden_detail' => 1
            ],
        ];

        foreach ($data as $value) {
            if (!$this->checkFieldExist($value['collection'], $value['field'])) {
                $fileds = $this->table('directus_fields');
                $fileds->insert($value)->save();
            }
        }
    }

    public function checkFieldExist($collection, $field)
    {
        $checkSql = sprintf('SELECT 1 FROM `directus_fields` WHERE `collection` = "%s" AND `field` = "%s";', $collection, $field);
        return $this->query($checkSql)->fetch();
    }
}
