<?php

namespace Directus\Database\Schema\Object;

use Directus\Config\StatusMapping;
use Directus\Database\Schema\DataTypes;

class Collection extends AbstractObject
{
    /**
     * @var Field[]
     */
    protected $fields = [];

    /**
     * @var array
     */
    protected $systemFields = [];

    /**
     * @var Field
     */
    protected $primaryField;

    /**
     * @var Field
     */
    protected $statusField;

    /**
     * @var Field
     */
    protected $sortingField;

    /**
     * @var Field
     */
    protected $userCreatedField;

    /**
     * @var Field
     */
    protected $userModifiedField;

    /**
     * @var Field
     */
    protected $dateCreatedField;

    /**
     * @var Field
     */
    protected $dateModifiedField;

    /**
     * @var Field
     */
    protected $langField;

    /**
     * Gets the collection's name
     *
     * @return string
     */
    public function getName()
    {
        return $this->attributes->get('collection');
    }

    /**
     * Sets the collection fields
     *
     * @param array $fields
     *
     * @return Collection
     */
    public function setFields(array $fields)
    {
        foreach ($fields as $field) {
            if (is_array($field)) {
                $field = new Field($field);
            }

            if (!($field instanceof Field)) {
                throw new \InvalidArgumentException('Invalid field object. ' . gettype($field) . ' given instead');
            }

            // @NOTE: This is a temporary solution
            // to always set the primary field to the first primary key field
            if (!$this->getPrimaryField() && $field->hasPrimaryKey()) {
                $this->primaryField = $field;
            } else if (!$this->getSortingField() && $field->isSortingType()) {
                $this->sortingField = $field;
            } else if (!$this->getStatusField() && $field->isStatusType()) {
                $this->statusField = $field;
            } else if (!$this->getDateCreatedField() && $field->isDateCreatedType()) {
                $this->dateCreatedField = $field;
            } else if (!$this->getUserCreatedField() && $field->isOwnerType()) {
                $this->userCreatedField = $field;;
            } else if (!$this->getDateModifiedField() && $field->isDateModifiedType()) {
                $this->dateModifiedField = $field;
            } else if (!$this->getUserModifiedField() && $field->isUserModifiedType()) {
                $this->userModifiedField = $field;
            } else if (!$this->getLangField() && $field->isLangType()) {
                $this->langField = $field;
            }

            $this->fields[$field->getName()] = $field;
        }

        return $this;
    }

    /**
     * Gets a list of the collection's fields
     *
     * @param array $names
     *
     * @return Field[]
     */
    public function getFields(array $names = [])
    {
        $fields = $this->fields;

        if ($names) {
            $fields = array_filter($fields, function (Field $field) use ($names) {
                return in_array($field->getName(), $names);
            });
        }

        return $fields;
    }

    /**
     * Returns a list of Fields not in the given list name
     *
     * @param array $names
     *
     * @return Field[]
     */
    public function getFieldsNotIn(array $names)
    {
        $fields = $this->fields;

        if ($names) {
            $fields = array_filter($fields, function (Field $field) use ($names) {
                return !in_array($field->getName(), $names);
            });
        }

        return $fields;
    }

    /**
     * Gets a field with the given name
     *
     * @param string $name
     *
     * @return Field
     */
    public function getField($name)
    {
        $fields = $this->getFields([$name]);

        // Gets the first matched result
        return array_shift($fields);
    }

    /**
     * Checks whether the collection is being managed by Directus
     *
     * @return bool
     */
    public function isManaged()
    {
        return $this->attributes->get('managed') == 1;
    }

    /**
     * Get all fields data as array
     *
     * @return array
     */
    public function getFieldsArray()
    {
        return array_map(function (Field $field) {
            return $field->toArray();
        }, $this->getFields());
    }

    /**
     * Returns an array representation a list of Fields not in the given list name
     *
     * @param array $names
     *
     * @return array
     */
    public function getFieldsNotInArray(array $names)
    {
        return array_map(function (Field $field) {
            return $field->toArray();
        }, $this->getFieldsNotIn($names));
    }

    /**
     * Gets all relational fields
     *
     * @param array $names
     *
     * @return Field[]
     */
    public function getRelationalFields(array $names = [])
    {
        return array_filter($this->getFields($names), function (Field $field) {
            return $field->hasRelationship();
        });
    }

    /**
     * Gets all relational fields
     *
     * @param array $names
     *
     * @return Field[]
     */
    public function getNonRelationalFields(array $names = [])
    {
        return array_filter($this->getFields($names), function (Field $field) {
            return !$field->hasRelationship();
        });
    }

    /**
     * Gets all the alias fields
     *
     * @return Field[]
     */
    public function getAliasFields()
    {
        return array_filter($this->getFields(), function (Field $field) {
            return $field->isAlias();
        });
    }

    /**
     * Gets all the non-alias fields
     *
     * @return Field[]
     */
    public function getNonAliasFields()
    {
        return array_filter($this->getFields(), function (Field $field) {
            return !$field->isAlias();
        });
    }

    /**
     * Gets all the fields name
     *
     * @return array
     */
    public function getFieldsName()
    {
        return array_map(function (Field $field) {
            return $field->getName();
        }, $this->getFields());
    }

    /**
     * Gets all the relational fields name
     *
     * @return array
     */
    public function getRelationalFieldsName()
    {
        return array_map(function (Field $field) {
            return $field->getName();
        }, $this->getRelationalFields());
    }

    /**
     * Gets all the alias fields name
     *
     * @return array
     */
    public function getAliasFieldsName()
    {
        return array_map(function (Field $field) {
            return $field->getName();
        }, $this->getAliasFields());
    }

    /**
     * Gets all the non-alias fields name
     *
     * @return array
     */
    public function getNonAliasFieldsName()
    {
        return array_map(function (Field $field) {
            return $field->getName();
        }, $this->getNonAliasFields());
    }

    /**
     * Checks whether the collection has a `primary key` interface field
     *
     * @return bool
     */
    public function hasPrimaryField()
    {
        return $this->getPrimaryField() ? true : false;
    }

    /**
     * Checks whether the collection has a `status` interface field
     *
     * @return bool
     */
    public function hasStatusField()
    {
        return $this->getStatusField() ? true : false;
    }

    /**
     * Checks whether the collection has a `sorting` interface field
     *
     * @return bool
     */
    public function hasSortingField()
    {
        return $this->getSortingField() ? true : false;
    }

    /**
     * Checks Whether or not the collection has the given field name
     *
     * @param string $name
     *
     * @return bool
     */
    public function hasField($name)
    {
        return array_key_exists($name, $this->fields);
    }

    /**
     * Checks whether or not the collection has the given data type field
     *
     * @param string $type
     *
     * @return bool
     */
    public function hasType($type)
    {
        foreach ($this->fields as $field) {
            if (strtolower($type) ===  strtolower($field->getType())) {
                return true;
            }
        }

        return false;
    }

    /**
     * Checks whether or not the collection has a JSON data type field
     *
     * @return bool
     */
    public function hasJsonField()
    {
        return $this->hasType(DataTypes::TYPE_JSON);
    }

    /**
     * Checks whether or not the collection has a Array data type field
     *
     * @return bool
     */
    public function hasArrayField()
    {
        return $this->hasType(DataTypes::TYPE_ARRAY);
    }

    /**
     * Checks whether or not the collection has a Boolean data type field
     *
     * @return bool
     */
    public function hasBooleanField()
    {
        return $this->hasType(DataTypes::TYPE_BOOLEAN);
    }

    /**
     * Gets the schema/database this collection belongs to
     *
     * @return null|string
     */
    public function getSchema()
    {
        return $this->attributes->get('schema', null);
    }

    /**
     * Whether or not the collection is hidden
     *
     * @return bool
     */
    public function isHidden()
    {
        return (bool) $this->attributes->get('hidden');
    }

    /**
     * Whether or not the collection is single
     *
     * @return bool
     */
    public function isSingle()
    {
        return (bool) $this->attributes->get('single');
    }

    /**
     * Gets the collection custom status mapping
     *
     * @return StatusMapping|null
     */
    public function getStatusMapping()
    {
        $statusField = $this->getStatusField();
        if (!$statusField) {
            return null;
        }

        $mapping = $statusField->getOptions('status_mapping');
        if ($mapping === null) {
            return $mapping;
        }

        if ($mapping instanceof StatusMapping) {
            return $mapping;
        }

        if (!is_array($mapping)) {
            $mapping = @json_decode($mapping, true);
        }

        if (is_array($mapping)) {
            $this->attributes->set('status_mapping', new StatusMapping($mapping));

            $mapping = $this->attributes->get('status_mapping');
        }

        return $mapping;
    }

    /**
     * Gets primary key interface field
     *
     * @return Field
     */
    public function getPrimaryField()
    {
        return $this->primaryField;
    }

    /**
     * Gets the primary key field
     *
     * @return Field|null
     */
    public function getPrimaryKey()
    {
        $primaryKeyField = null;

        foreach ($this->getFields() as $field) {
            if ($field->hasPrimaryKey()) {
                $primaryKeyField = $field;
                break;
            }
        }

        return $primaryKeyField;
    }

    /**
     * Gets primary key interface field's name
     *
     * @return string
     */
    public function getPrimaryKeyName()
    {
        $primaryField = $this->getPrimaryKey();
        $name = null;

        if ($primaryField) {
            $name = $primaryField->getName();
        }

        return $name;
    }

    /**
     * Gets status field
     *
     * @return Field|null
     */
    public function getStatusField()
    {
        return $this->statusField;
    }

    /**
     * Gets the sort interface field
     *
     * @return Field|null
     */
    public function getSortingField()
    {
        return $this->sortingField;
    }

    /**
     * Gets the field storing the record's user owner
     *
     * @return Field|bool
     */
    public function getUserCreatedField()
    {
        return $this->userCreatedField;
    }

    /**
     * Gets the field storing the user updating the record
     *
     * @return Field|null
     */
    public function getUserModifiedField()
    {
        return $this->userModifiedField;
    }

    /**
     * Gets the field storing the record created time
     *
     * @return Field|null
     */
    public function getDateCreatedField()
    {
        return $this->dateCreatedField;
    }

    /**
     * Gets the field storing the record updated time
     *
     * @return Field|null
     */
    public function getDateModifiedField()
    {
        return $this->dateModifiedField;
    }

    /**
     * Returns the lang field
     *
     * @return Field|null
     */
    public function getLangField()
    {
        return $this->langField;
    }

    /**
     * Gets the collection comment
     *
     * @return string
     */
    public function getNote()
    {
        return $this->attributes->get('comment');
    }

    /**
     * Array representation of the collection with fields
     *
     * @return array
     */
    public function toArray()
    {
        $attributes = parent::toArray();
        $attributes['fields'] = $this->getFieldsArray();

        return $attributes;
    }
}
