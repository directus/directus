<?php
namespace Directus\GraphQL;

use Directus\GraphQL\Types;
use Directus\Application\Application;
use Directus\Services\TablesService;
use Directus\Services\RelationsService;

class FieldsConfig
{
    private $collection;
    private $container;
    private $service;
    private $collectionData;
    private $collectionFields;
    public function __construct($collection)
    {
        $this->container = Application::getInstance()->getContainer();
        $this->collection = $collection;
        $this->service = new TablesService($this->container);
        $this->collectionData = $this->service->findAllFieldsByCollection(
            $this->collection
        );
        $this->collectionFields = $this->collectionData['data'];
    }

    public function getFields()
    {
        $fields = [];

        foreach ($this->collectionFields as $k => $v) {

            switch (strtolower($v['type'])) {
                case 'array':
                    $fields[$v['field']] = Types::listOf(Types::string());
                    break;
                case 'boolean':
                    $fields[$v['field']] = Types::boolean();
                    break;
                case 'datetime':
                case 'datetime_created':
                case 'datetime_updated':
                    $fields[$v['field']] = Types::datetime();
                    break;
                case 'date':
                    $fields[$v['field']] = Types::date();
                    break;
                case 'file':
                    $fields[$v['field']] = Types::directusFile();
                    break;
                case 'integer':
                    $fields[$v['field']] = ($v['interface'] == 'primary-key') ? $fields[$v['field']] = Types::id() : Types::int();
                    break;
                case 'decimal':
                    $fields[$v['field']] = Types::float();
                    break;
                case 'json':
                    $fields[$v['field']] = Types::json();
                    break;
                case 'm2o':
                    $relation = $this->getRelation('m2o', $v['collection'], $v['field']);
                    $fields[$v['field']] = Types::userCollection($relation['collection_one']);
                    break;
                case 'o2m':
                    $relation = $this->getRelation('o2m', $v['collection'], $v['field']);
                    $temp = [];
                    $temp['type'] = Types::listOf(Types::userCollection($relation['collection_one']));
                    $temp['resolve'] = function ($value) use ($relation) {
                        $data = [];
                        foreach ($value[$relation['collection_one']] as  $v) {
                            $data[] = $v[$relation['field_many']];
                        }
                        return $data;
                    };
                    $fields[$v['field']] = $temp;
                    break;
                case 'sort':
                    $fields[$v['field']] = Types::int();
                    break;
                case 'status':
                    $fields[$v['field']] = Types::string();
                    break;
                case 'time':
                    $fields[$v['field']] = Types::time();
                    break;
                case 'user_created':
                case 'user_updated':
                    $fields[$v['field']] = Types::directusUser();
                    break;
                default:
                    $fields[$v['field']] = Types::string();
            }
            if ($v['required']) {
                $fields[$v['field']] = Types::NonNull($fields[$v['field']]);
            }
        }
        return $fields;
    }

    public function getFilters()
    {
        $filters = [];

        foreach ($this->collectionFields as $k => $v) {

            switch (strtolower($v['type'])) {
                case 'boolean':
                    $filters[$v['field'] . '_eq'] = Types::boolean();
                    break;
                case 'datetime':
                case 'datetime_created':
                case 'datetime_updated':
                    $filters[$v['field'] . '_eq'] = Types::datetime();
                    $filters[$v['field'] . '_neq'] = Types::datetime();
                    $filters[$v['field'] . '_lt'] = Types::datetime();
                    $filters[$v['field'] . '_lte'] = Types::datetime();
                    $filters[$v['field'] . '_gt'] = Types::datetime();
                    $filters[$v['field'] . '_gte'] = Types::datetime();
                    $filters[$v['field'] . '_in'] = Types::datetime();
                    $filters[$v['field'] . '_nin'] = Types::datetime();
                    $filters[$v['field'] . '_between'] = Types::string();
                    $filters[$v['field'] . '_nbetween'] = Types::string();
                    break;
                case 'integer':
                    $filters[$v['field'] . '_eq'] = Types::int();
                    $filters[$v['field'] . '_neq'] = Types::int();
                    $filters[$v['field'] . '_lt'] = Types::int();
                    $filters[$v['field'] . '_lte'] = Types::int();
                    $filters[$v['field'] . '_gt'] = Types::int();
                    $filters[$v['field'] . '_gte'] = Types::int();
                    $filters[$v['field'] . '_in'] = Types::string();
                    $filters[$v['field'] . '_nin'] = Types::string();
                    $filters[$v['field'] . '_between'] = Types::string();
                    $filters[$v['field'] . '_nbetween'] = Types::string();
                    break;
                case 'decimal':
                    $filters[$v['field'] . '_eq'] = Types::float();
                    $filters[$v['field'] . '_neq'] = Types::float();
                    $filters[$v['field'] . '_lt'] = Types::float();
                    $filters[$v['field'] . '_lte'] = Types::float();
                    $filters[$v['field'] . '_gt'] = Types::float();
                    $filters[$v['field'] . '_gte'] = Types::float();
                    $filters[$v['field'] . '_in'] = Types::string();
                    $filters[$v['field'] . '_nin'] = Types::string();
                    $filters[$v['field'] . '_between'] = Types::string();
                    $filters[$v['field'] . '_nbetween'] = Types::string();
                    break;
                case 'time':
                    $filters[$v['field'] . '_eq'] = Types::string();
                    $filters[$v['field'] . '_neq'] = Types::string();
                    $filters[$v['field'] . '_lt'] = Types::string();
                    $filters[$v['field'] . '_lte'] = Types::string();
                    $filters[$v['field'] . '_gt'] = Types::string();
                    $filters[$v['field'] . '_gte'] = Types::string();
                    $filters[$v['field'] . '_in'] = Types::string();
                    $filters[$v['field'] . '_nin'] = Types::string();
                    $filters[$v['field'] . '_between'] = Types::string();
                    $filters[$v['field'] . '_nbetween'] = Types::string();
                    break;
                case 'status':
                    $filters[$v['field'] . '_eq'] = Types::string();
                    $filters[$v['field'] . '_neq'] = Types::string();
                    $filters[$v['field'] . '_in'] = Types::string();
                    $filters[$v['field'] . '_nin'] = Types::string();
                    break;
                case 'string':
                    $filters[$v['field'] . '_contains'] = Types::string();
                    $filters[$v['field'] . '_ncontains'] = Types::string();
                    $filters[$v['field'] . '_rlike'] = Types::string();
                    $filters[$v['field'] . '_nrlike'] = Types::string();
                    $filters[$v['field'] . '_empty'] = Types::string();
                    $filters[$v['field'] . '_nempty'] = Types::string();
                    $filters[$v['field'] . '_null'] = Types::string();
                    $filters[$v['field'] . '_nnull'] = Types::string();
                    break;

                default:
                    /* As the _has and _all not working properly
                    *  https://github.com/directus/api/issues/576
                    *  We will fix once the issue in the REST endpoint will fix.
                    */
                    // $filters[$v['field'] . '_all'] = Types::nonNull(Types::string());
                    // $filters[$v['field'] . '_has'] = Types::nonNull(Types::string());
            }
        }
        $filters['or'] = Types::listOf(Types::filters($this->collection));
        $filters['and'] = Types::listOf(Types::filters($this->collection));

        return $filters;
    }

    private function getRelation($type, $collection, $field)
    {
        //List all the relation
        $relationsService = new RelationsService($this->container);
        $relationsData = $relationsService->findAll();
        $relation = [];
        switch ($type) {
            case 'm2o':
                foreach ($relationsData['data'] as $k => $v) {
                    if ($v['collection_many'] == $collection && $v['field_many'] == $field) {
                        $relation = $v;
                        break;
                    }
                }
                break;
            case 'o2m':
                /**
                 * TODO :: Need to rewrite the code for better readiablity.
                 */
                $firstRelation;

                //1. Find the collection_many
                foreach ($relationsData['data'] as $k => $v) {
                    if ($v['collection_one'] == $collection && $v['field_one'] == $field) {
                        $firstRelation = $v;
                        break;
                    }
                }
                $collectionMany = $firstRelation['collection_many'];
                $collection1Id = $firstRelation['id'];

                //2. Find the 2nd collection_one
                foreach ($relationsData['data'] as $k => $v) {
                    if ($v['collection_many'] == $collectionMany && $v['id'] != $collection1Id) {
                        $relation = $v;
                        break;
                    }
                }

                if (count($relation) == 0) {
                    $relation = $firstRelation;
                }

                break;
        }

        return $relation;
    }
}
