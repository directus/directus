<?php
namespace Directus\GraphQL\Collection;

use Directus\GraphQL\Types;
use GraphQL\Type\Definition\ResolveInfo;
use Directus\Services\ItemsService;
use Directus\Services\TablesService;
use Directus\GraphQL\Collection\CollectionList;

class UserCollectionList extends CollectionList
{

    public $list;

    public function __construct()
    {
        parent::__construct();

        //List all the collection
        $service = new TablesService($this->container);
        $collectionData = $service->findAll();

        $itemsService = new ItemsService($this->container);
        foreach ($collectionData['data'] as  $value) {
            if ($value['managed']) {

                $type = Types::userCollection($value['collection']);
                //Add the list of collection
                $this->list[$value['collection']] = [
                    'type' => Types::collections($type),
                    'args' => array_merge($this->id, $this->limit, $this->offset, $this->lang, ['filter' => Types::filters($value['collection'])]),
                    'resolve' => function ($val, $args, $context, ResolveInfo $info) use ($value, $itemsService) {
                        $itemsService->throwErrorIfSystemTable($value['collection']);
                        $responseData = [];
                        if (isset($args['id'])) {
                            // Convert JSON of the single item into array.
                            $responseData['data'][0] =  $itemsService->find($value['collection'], $args['id'], $this->param)['data'];
                        } else {
                            $this->convertArgsToFilter($args);
                            $responseData = $itemsService->findAll($value['collection'], $this->param);
                        }
                        return $responseData;
                    }
                ];
            }
        }
    }
}
