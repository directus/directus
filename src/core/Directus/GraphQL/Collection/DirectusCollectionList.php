<?php
namespace Directus\GraphQL\Collection;

use Directus\GraphQL\Types;
use GraphQL\Type\Definition\ResolveInfo;
use Directus\Services\ActivityService;
use Directus\Services\TablesService;
use Directus\Services\CollectionPresetsService;
use Directus\Services\FilesServices;
use Directus\Services\PermissionsService;
use Directus\Services\RelationsService;
use Directus\Services\RevisionsService;
use Directus\Services\UsersService;
use Directus\Services\RolesService;
use Directus\Services\SettingsService;
use Directus\GraphQL\Collection\CollectionList;
use function GuzzleHttp\json_encode;

class DirectusCollectionList extends CollectionList
{

    public $list;

    public function __construct()
    {

        parent::__construct();

        $this->list = [
            'directus_activity' => [
                'type' => Types::collections(Types::directusActivity()),
                'args' => array_merge($this->id, $this->limit, $this->offset, ['filter' => Types::filters('directus_activity')]),
                'resolve' => function ($val, $args, $context, ResolveInfo $info) {
                    $service = new ActivityService($this->container);
                    $responseData = [];
                    if (isset($args['id'])) {
                        // Convert JSON of the single item into array.
                        $responseData['data'][0] =  $service->findByIds($args['id'], $this->param)['data'];
                    } else {
                        $this->convertArgsToFilter($args);
                        $responseData = $service->findAll($this->param);
                    }
                    return $responseData;
                }
            ],
            'directus_collections' => [
                'type' => Types::collections(Types::directusCollection()),
                'args' => array_merge(['name' => Types::string()], $this->limit, $this->offset),
                'resolve' => function ($val, $args, $context, ResolveInfo $info) {
                    $service = new TablesService($this->container);
                    $responseData = [];
                    if (isset($args['id'])) {
                        $responseData['data'][0] =  $service->findByIds($args['name'], $this->param)['data'];
                    } else {
                        $this->convertArgsToFilter($args);
                        $responseData = $service->findAll($this->param);
                    }
                    return $responseData;
                }
            ],
            'directus_collection_presets' => [
                'type' => Types::collections(Types::directusCollectionPreset()),
                'args' => array_merge(['id' => Types::id()], $this->limit, $this->offset, ['filter' => Types::filters('directus_collection_presets')]),
                'resolve' => function ($val, $args, $context, ResolveInfo $info) {
                    $this->convertArgsToFilter($args);
                    $service = new CollectionPresetsService($this->container);
                    $responseData = [];
                    if (isset($args['id'])) {
                        $responseData['data'][0] =  $service->findByIds($args['id'], $this->param)['data'];
                    } else {
                        $this->convertArgsToFilter($args);
                        $responseData = $service->findAll($this->param);
                    }
                    return $responseData;
                }
            ],
            'directus_fields' => [
                'type' => Types::collections(Types::directusField()),
                'args' => ['collection' => Types::string(), 'field' => Types::string()],
                'resolve' => function ($val, $args, $context, ResolveInfo $info) {
                    $this->convertArgsToFilter($args);
                    $service = new TablesService($this->container);
                    if (isset($args['collection']) && isset($args['field'])) {
                        $responseData['data'][0] = $service->findField(
                            $args['collection'],
                            $args['field'],
                            $this->param
                        )['data'];
                    } elseif (isset($args['collection'])) {
                        $responseData = $service->findAllFieldsByCollection(
                            $args['collection'],
                            $this->param
                        );
                    } else {
                        $responseData = $service->findAllFields(
                            $this->param
                        );
                    }
                    return $responseData;
                }
            ],
            'directus_files' => [
                'type' => Types::collections(Types::directusFile()),
                'args' => array_merge(['id' => Types::id()], $this->limit, $this->offset, ['filter' => Types::filters('directus_files')]),
                'resolve' => function ($val, $args, $context, ResolveInfo $info) {
                    $service = new FilesServices($this->container);
                    $responseData = [];
                    if (isset($args['id'])) {
                        $responseData['data'][0] =  $service->findByIds($args['id'], $this->param)['data'];
                    } else {
                        $this->convertArgsToFilter($args);
                        $responseData = $service->findAll($this->param);
                    }
                    return $responseData;
                }
            ],
            'directus_folders' => [
                'type' => Types::collections(Types::directusFolder()),
                'args' => array_merge(['id' => Types::id()], $this->limit, $this->offset, ['filter' => Types::filters('directus_folders')]),
                'resolve' => function ($val, $args, $context, ResolveInfo $info) {
                    $service = new FilesServices($this->container);
                    $responseData = [];
                    if (isset($args['id'])) {
                        $responseData['data'][0] =  $service->findFolderByIds($args['id'], $this->param)['data'];
                    } else {
                        $this->convertArgsToFilter($args);
                        $responseData = $service->findAllFolders($this->param);
                    }
                    return $responseData;
                }
            ],
            'directus_permissions' => [
                'type' => Types::collections(Types::directusPermission()),
                'args' => array_merge(['id' => Types::id()], $this->limit, $this->offset, ['filter' => Types::filters('directus_permissions')]),
                'resolve' => function ($val, $args, $context, ResolveInfo $info) {
                    $service = new PermissionsService($this->container);
                    $responseData = [];
                    if (isset($args['id'])) {
                        $responseData['data'][0] =  $service->findByIds($args['id'], $this->param)['data'];
                    } else {
                        $this->convertArgsToFilter($args);
                        $responseData = $service->findAll($this->param);
                    }
                    return $responseData;
                }
            ],
            'directus_relations' => [
                'type' => Types::collections(Types::directusRelation()),
                'args' => array_merge(['id' => Types::id()], $this->limit, $this->offset, ['filter' => Types::filters('directus_permissions')]),
                'resolve' => function ($val, $args, $context, ResolveInfo $info) {
                    $service = new RelationsService($this->container);
                    $responseData = [];
                    if (isset($args['id'])) {
                        $responseData['data'][0] =  $service->findByIds($args['id'], $this->param)['data'];
                    } else {
                        $this->convertArgsToFilter($args);
                        $responseData = $service->findAll($this->param);
                    }
                    return $responseData;
                }
            ],
            'directus_revisions' => [
                'type' => Types::collections(Types::directusRevision()),
                'args' => array_merge(['id' => Types::id()], $this->limit, $this->offset),
                'resolve' => function ($val, $args, $context, ResolveInfo $info) {
                    $service = new RevisionsService($this->container);
                    $responseData = [];
                    if (isset($args['id'])) {
                        $responseData['data'][0] =  $service->findByIds($args['id'], $this->param)['data'];
                    } else {
                        $this->convertArgsToFilter($args);
                        $responseData = $service->findAll($this->param);
                    }
                    return $responseData;
                }
            ],
            'directus_roles' => [
                'type' => Types::collections(Types::directusRole()),
                'args' => array_merge(['id' => Types::id()], $this->limit, $this->offset),
                'resolve' => function ($val, $args, $context, ResolveInfo $info) {
                    $service = new RolesService($this->container);

                    $responseData = [];
                    if (isset($args['id'])) {
                        $responseData['data'][0] =  $service->findByIds($args['id'], $this->param)['data'];
                    } else {
                        $this->convertArgsToFilter($args);
                        $responseData = $service->findAll($this->param);
                    }
                    return $responseData;
                }
            ],
            'directus_settings' => [
                'type' => Types::collections(Types::directusSetting()),
                'args' => array_merge(['id' => Types::id()], $this->limit, $this->offset),
                'resolve' => function ($val, $args, $context, ResolveInfo $info) {
                    $service = new SettingsService($this->container);
                    $responseData = [];
                    if (isset($args['id'])) {
                        // Convert JSON of the single item into array.
                        $responseData['data'][0] =  $service->findByIds($args['id'], $this->param)['data'];
                    } else {
                        $this->convertArgsToFilter($args);
                        $responseData = $service->findAll($this->param);
                    }
                    return $responseData;
                }
            ],
            'directus_users' => [
                'type' => Types::collections(Types::directusUser()),
                'args' => array_merge(['id' => Types::id()], $this->limit, $this->offset, ['filter' => Types::filters('directus_users')]),
                'resolve' => function ($val, $args, $context, ResolveInfo $info) {
                    $service = new UsersService($this->container);
                    $responseData = [];
                    if (isset($args['id'])) {
                        // Convert JSON of the single item into array.
                        $responseData['data'][0] =  $service->findByIds($args['id'], $this->param)['data'];
                    } else {
                        $this->convertArgsToFilter($args);
                        $responseData = $service->findAll($this->param);
                    }
                    return $responseData;
                }
            ]
        ];
    }
}
