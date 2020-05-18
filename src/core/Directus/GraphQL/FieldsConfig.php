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
                    // Check if this field is actually part of an M2O relation
                    $other = $this->getOtherCollectionManyToOne(
                        $v['collection'], $v['field']);
                    if (!is_null($other)) {
                        // This field is part of an M2O, pointing to collection
                        // $other
                        $fields[$v['field']] = Types::userCollection($other);
                    } else if ($v['interface'] == 'primary-key') {
                        // This is the primary key of the table
                        $fields[$v['field']] = Types::id();
                    } else {
                        // This is just a plain integer
                        $fields[$v['field']] = Types::int();
                    }
                    break;
                case 'decimal':
                    $fields[$v['field']] = Types::float();
                    break;
                case 'json':
                    $fields[$v['field']] = Types::json();
                    break;
                case 'm2o':
                    $collection = $this->getOtherCollectionManyToOne(
                        $v['collection'], $v['field']);
                    $fields[$v['field']] = Types::userCollection($collection);
                    break;
                case 'o2m':
                case 'translation': // translation is just an o2m collection
                    $collection = $this->getOtherCollectionOneToMany(
                        $v['collection'], $v['field']);
                    $fields[$v['field']] = Types::listOf(
                        Types::userCollection($collection));
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
                case 'owner':
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
                    $filters[$v['field'] . '_eq'] = Types::string();
                    $filters[$v['field'] . '_neq'] = Types::string();
                    $filters[$v['field'] . '_contains'] = Types::string();
                    $filters[$v['field'] . '_ncontains'] = Types::string();
                    $filters[$v['field'] . '_rlike'] = Types::string();
                    $filters[$v['field'] . '_nrlike'] = Types::string();
                    $filters[$v['field'] . '_empty'] = Types::string();
                    $filters[$v['field'] . '_nempty'] = Types::string();
                    $filters[$v['field'] . '_null'] = Types::string();
                    $filters[$v['field'] . '_nnull'] = Types::string();
                    break;
                case 'owner':
                    $filters[$v['field'] . '_eq'] = Types::int();
                    $filters[$v['field'] . '_neq'] = Types::int();
                    $filters[$v['field'] . '_in'] = Types::string();
                    $filters[$v['field'] . '_nin'] = Types::string();
                    break;
                case 'm2o':
                    $filters[$v['field'] . '_eq'] = Types::int();
                    $filters[$v['field'] . '_neq'] = Types::int();
                    $filters[$v['field'] . '_in'] = Types::string();
                    $filters[$v['field'] . '_nin'] = Types::string();
                    $filters[$v['field'] . '_contains'] = Types::string();
                    $filters[$v['field'] . '_ncontains'] = Types::string();
                    $filters[$v['field'] . '_rlike'] = Types::string();
                    $filters[$v['field'] . '_nrlike'] = Types::string();
                    break;
                default:
                    $filters[$v['field'] . '_all'] = Types::string();
                    $filters[$v['field'] . '_has'] = Types::string();
            }
        }
        $filters['or'] = Types::listOf(Types::filters($this->collection));
        $filters['and'] = Types::listOf(Types::filters($this->collection));

        return $filters;
    }

   /**
     * Given collection and a field on the same collection, which is assumed
     * to be an one to many relation, returns the name of the other (many)
     * collection.
     *
     * @param string $collection The name of the collection
     * @param string $field The name of the field
     * @return string The name of the other (many) collection
     */
    private function getOtherCollectionOneToMany($collection, $field)
    {
        $relationsService = new RelationsService($this->container);
        $relationsData = $relationsService->findAll([
            'filter' => [
                'collection_one' => $collection,
                'field_one' => $field
            ]
        ])['data'];

        foreach ($relationsData as $v) {
            if ($v) {
                return $v['collection_many'];
            }
        }

        return null;
    }

    /**
     * Given collection and a field on the same collection, which is assumed
     * to be a many to one relation, returns the name of the other (one)
     * collection.
     *
     * @param string $collection The name of the collection
     * @param string $field The name of the field
     * @return string The name of the other (one) collection
     */
    private function getOtherCollectionManyToOne($collection, $field)
    {
        $relationsService = new RelationsService($this->container);
        $relationsData = $relationsService->findAll([
            'filter' => [
                'collection_many' => $collection,
                'field_many' => $field
            ]
        ])['data'];

        foreach ($relationsData as $v) {
            if ($v) { return $v['collection_one']; }
        }

        return null;
    }
}
