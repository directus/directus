<?php

namespace Directus\Database\Schema\Object;

use Directus\Database\Schema\DataTypes;
use Directus\Util\ArrayUtils;

class Field extends AbstractObject
{
    /**
     * @var FieldRelationship
     */
    protected $relationship;

    /**
     * Gets the field item identification number
     *
     * @return int
     */
    public function getId()
    {
        return $this->attributes->get('id');
    }

    /**
     * Gets the field name
     *
     * @return string
     */
    public function getName()
    {
        return $this->attributes->get('field');
    }

    /**
     * Gets the field name with proper formatisation
     *
     * @return string
     */
    public function getFormatisedName()
    {
        return ucwords(str_replace("_", " ", $this->attributes->get('field')));
    }

    /**
     * Gets the field type
     *
     * @return string
     */
    public function getType()
    {
        return $this->attributes->get('type');
    }

    /**
     * Gets the field original type (based on its database)
     *
     * @return string
     */
    public function getDataType()
    {
        return $this->attributes->get('datatype');
    }

    /**
     * Get the field length
     *
     * @return int
     */
    public function getLength()
    {
        $length = $this->getCharLength();

        if (!$length) {
            $length = (int) $this->attributes->get('length');
        }

        return $length;
    }

    /**
     * Gets field full type (mysql)
     *
     * @return string
     */
    public function getColumnType()
    {
        // TODO: Make this from the schema manager
        return $this->attributes->get('column_type');
    }

    /**
     * Checks whether the fields only accepts signed values
     *
     * @return bool
     */
    public function isSigned()
    {
        return (bool) $this->attributes->get('signed');
    }

    /**
     * Checks whether the columns has zero fill attribute
     *
     * @return bool
     */
    public function hasZeroFill()
    {
        $type = $this->getColumnType();

        return strpos($type, 'zerofill') !== false;
    }

    /**
     * Gets the field character length
     *
     * @return int
     */
    public function getCharLength()
    {
        return (int) $this->attributes->get('char_length');
    }

    /**
     * Gets field precision
     *
     * @return int
     */
    public function getPrecision()
    {
        return (int) $this->attributes->get('precision');
    }

    /**
     * Gets field scale
     *
     * @return int
     */
    public function getScale()
    {
        return (int) $this->attributes->get('scale');
    }

    /**
     * Gets field ordinal position
     *
     * @return int
     */
    public function getSort()
    {
        return (int) $this->attributes->get('sort');
    }

    /**
     * Gets field default value
     *
     * @return mixed
     */
    public function getDefaultValue()
    {
        return $this->attributes->get('default_value');
    }

    /**
     * Gets whether or not the field is nullable
     *
     * @return bool
     */
    public function isNullable()
    {
        return boolval($this->attributes->get('nullable'));
    }

    /**
     * Gets the field key
     *
     * @return string
     */
    public function getKey()
    {
        return $this->attributes->get('key');
    }

    /**
     * Gets the field extra
     *
     * @return string
     */
    public function getExtra()
    {
        return $this->attributes->get('extra');
    }

    /**
     * Gets whether or not the column has auto increment
     *
     * @return bool
     */
    public function hasAutoIncrement()
    {
        return (bool) $this->attributes->get('auto_increment', false);
    }

    /**
     * Checks whether or not the field has primary key
     *
     * @return bool
     */
    public function hasPrimaryKey()
    {
        return (bool) $this->attributes->get('primary_key', false);
    }

    /**
     * Checks whether or not the field has unique key
     *
     * @return bool
     */
    public function hasUniqueKey()
    {
        return (bool) $this->attributes->get('unique', false);
    }

    /**
     * Gets whether the field is required
     *
     * @return bool
     */
    public function isRequired()
    {
        return $this->attributes->get('required');
    }

    /**
     * Gets the interface name
     *
     * @return string
     */
    public function getInterface()
    {
        return $this->attributes->get('interface');
    }

    /**
     * Gets all or the given key options
     *
     * @param string|null $key
     *
     * @return mixed
     */
    public function getOptions($key = null)
    {
        $options = [];
        if ($this->attributes->has('options')) {
            $options = $this->attributes->get('options');
        }

        if ($key !== null && is_array($options)) {
            $options = ArrayUtils::get($options, $key);
        }

        return $options;
    }

    /**
     * Gets whether the field must be hidden in lists
     *
     * @return bool
     */
    public function isHiddenBrowse()
    {
        return $this->attributes->get('hidden_browse');
    }

    /**
     * Gets whether the field must be hidden in forms
     *
     * @return bool
     */
    public function isHiddenDetail()
    {
        return $this->attributes->get('hidden_detail');
    }

    /**
     * Gets the field comment
     *
     * @return null|string
     */
    public function getNote()
    {
        return $this->attributes->get('comment');
    }

    /**
     * Gets the field regex pattern validation string
     *
     * @return string|null
     */
    public function getValidation()
    {
        return $this->attributes->get('validation');
    }

    /**
     * Gets the collection's name the field belongs to
     *
     * @return string
     */
    public function getCollectionName()
    {
        return $this->attributes->get('collection');
    }

    /**
     * Checks whether the field is an alias
     *
     * @return bool
     */
    public function isAlias()
    {
        return DataTypes::isAliasType($this->getType());
    }

    /**
     * Checks whether this column is date system interface
     *
     * @return bool
     */
    public function isSystemDateTimeType()
    {
        return DataTypes::isSystemDateTimeType($this->getType());
    }

    /**
     * Checks whether this column is system user interface
     *
     * @return bool
     */
    public function isSystemUserType()
    {
        return DataTypes::isSystemUserType($this->getType());
    }

    /**
     * Checks whether or not the field is a status type
     *
     * @return bool
     */
    public function isStatusType()
    {
        return $this->isType(DataTypes::TYPE_STATUS);
    }

    /**
     * Checks whether or not the field is a sort type
     *
     * @return bool
     */
    public function isSortingType()
    {
        return $this->isType(DataTypes::TYPE_SORT);
    }

    /**
     * Checks whether or not the field is a date created type
     *
     * @return bool
     */
    public function isDateCreatedType()
    {
        return $this->isType(DataTypes::TYPE_DATETIME_CREATED);
    }

    /**
     * Checks whether or not the field is an user created type
     *
     * @return bool
     */
    public function isOwnerType()
    {
        return $this->isType(DataTypes::TYPE_OWNER);
    }

    /**
     * Checks whether or not the field is a date modified type
     *
     * @return bool
     */
    public function isDateModifiedType()
    {
        return $this->isType(DataTypes::TYPE_DATETIME_UPDATED);
    }

    /**
     * Checks whether or not the field is an user modified type
     *
     * @return bool
     */
    public function isUserModifiedType()
    {
        return $this->isType(DataTypes::TYPE_USER_UPDATED);
    }

    /**
     * Checks whether or not the field is a lang type
     *
     * @return bool
     */
    public function isLangType()
    {
        return $this->isType(DataTypes::TYPE_LANG);
    }

    /**
     * Checks whether or not the field is the given type
     *
     * @param string $type
     *
     * @return bool
     */
    public function isType($type)
    {
        return strtolower($type) === strtolower($this->getType());
    }

    /**
     * Set the column relationship
     *
     * @param FieldRelationship|array $relationship
     *
     * @return Field
     */
    public function setRelationship($relationship)
    {
        // Ignore relationship information if the field is primary key
        if (!$this->hasPrimaryKey()) {
            // Relationship can be pass as an array
            if (!($relationship instanceof FieldRelationship)) {
                $relationship = new FieldRelationship($this, $relationship);
            }

            $this->relationship = $relationship;
        }

        return $this;
    }

    /**
     * Gets the field relationship
     *
     * @return FieldRelationship
     */
    public function getRelationship()
    {
        return $this->relationship;
    }

    /**
     * Checks whether the field has relationship
     *
     * @return bool
     */
    public function hasRelationship()
    {
        return $this->getRelationship() instanceof FieldRelationship;
    }

    /**
     * Gets the field relationship type
     *
     * @return null|string
     */
    public function getRelationshipType()
    {
        $type = null;

        if ($this->hasRelationship()) {
            $type = $this->getRelationship()->getType();
        }

        return $type;
    }

    /**
     * Checks whether the relationship is MANY TO ONE
     *
     * @return bool
     */
    public function isManyToOne()
    {
        return $this->hasRelationship() ? $this->getRelationship()->isManyToOne() : false;
    }

    /**
     * Checks whether the relationship is ONE TO MANY
     *
     * @return bool
     */
    public function isOneToMany()
    {
        return $this->hasRelationship() ? $this->getRelationship()->isOneToMany() : false;
    }

    /**
     * Is the field being managed by Directus
     *
     * @return bool
     */
    public function isManaged()
    {
        return $this->attributes->get('managed') == 1;
    }

    /**
     * @return array
     */
    public function toArray()
    {
        $attributes = parent::toArray();
        $attributes['relationship'] = $this->hasRelationship() ? $this->getRelationship()->toArray() : null;

        return $attributes;
    }
}
