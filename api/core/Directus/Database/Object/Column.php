<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Database\Object;

use Directus\Collection\Arrayable;
use Directus\Database\SchemaManager;
use Directus\Util\ArrayUtils;
use Directus\Util\Traits\ArrayPropertyAccess;
use Directus\Util\Traits\ArrayPropertyToArray;
use Directus\Util\Traits\ArraySetter;

/**
 * Column Object
 *
 * Represents a column
 *
 * @author Welling Guzmán <welling@rngr.org>
 */

class Column implements \ArrayAccess, Arrayable, \JsonSerializable
{
    use ArraySetter, ArrayPropertyAccess, ArrayPropertyToArray;

    const ALIAS = 'ALIAS';

    /**
     * @var string
     */
    protected $id;

    /**
     * @var string
     */
    protected $name;

    /**
     * Fallback to legacy property
     *
     * @var string
     */
    protected $column_name;

    /**
     * @var string
     */
    protected $type = 'string';

    /**
     * Complete data type
     *
     * Needed for ENUM and SET where their values are stored in here
     * also unsigned and zerofill
     *
     * @var string
     */
    protected $columnType;

    /**
     * @var int
     */
    protected $length;

    /**
     * @var int
     */
    protected $precision = 0;

    /**
     * @var int
     */
    protected $scale = 0;

    /**
     * The column position within its table
     *
     * @var int
     */
    protected $sort = 0;

    /**
     * @var mixed
     */
    protected $defaultValue;

    /**
     * Whether the column accepts null as a value
     *
     * @var boolean
     */
    protected $nullable;

    /**
     * @var string
     */
    protected $key;

    /**
     * @var string
     */
    protected $extra;

    /**
     * @var array
     */
    protected $extraOptions = [];

    /**
     * @var array
     */
    protected $options = [];

    /**
     * @var string
     */
    protected $tableName;

    /**
     * @var bool
     */
    protected $required = false;

    /**
     * @var bool
     */
    protected $system = false;

    /**
     * @var string
     */
    protected $ui;

    /**
     * Whether the column will be hidden on forms
     *
     * @var bool
     */
    protected $hiddenInput = false;

    /**
     * @var ColumnRelationship
     */
    protected $relationship;

    /**
     * @var null|string
     */
    protected $comment;

    /**
     * @var array
     */
    protected $readableProperty = [];

    /**
     * @var array
     */
    protected $writableProperty = [];

    /**
     * @var array
     */
    protected $avoidSerializing = [
        'writableProperty',
        'readableProperty'
    ];

    public function __construct($data)
    {
        if (!is_array($data)) {
            $data = ['column_name' => $data];
        }

        $this->setData($data);

        $this->readableProperty = $this->writableProperty = [
            'id',
            'name',
            'type',
            'default_value',
            'nullable',
            'column_key',
            'options',
            'extra',
            'required',
            'ui',
            'hidden_input',
            'relationship',
            'comment',
            'table_name',
            'system'
        ];
    }

    /**
     * Set the column identification name
     *
     * @param $id
     *
     * @return Column
     */
    public function setId($id)
    {
        $this->id = $id;

        return $this;
    }

    /**
     * Get the column identification name
     *
     * @return string
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set the column name
     *
     * @param $name
     *
     * @return Column
     */
    public function setName($name)
    {
        $this->name = $this->column_name = $name;

        return $this;
    }

    /**
     * Set the column name
     *
     * @see Column::setName (alias)
     *
     * @param $name
     *
     * @return Column
     */
    public function setColumnName($name)
    {
        return $this->setName($name);
    }

    /**
     * Get the column name
     *
     * @return string
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * Get the column name
     *
     * @see Column::getName (alias)
     *
     * @return string
     */
    public function getColumnName()
    {
        return $this->getName();
    }

    /**
     * Set the column type
     *
     * @param $type
     *
     * @return Column
     */
    public function setType($type)
    {
        $this->type = $type;

        return $this;
    }

    /**
     * Set the column type
     *
     * @see Column::setType (alias)
     *
     * @param $type
     *
     * @return Column
     */
    public function setDataType($type)
    {
        return $this->setType($type);
    }

    /**
     * Get the column type
     *
     * @return string
     */
    public function getType()
    {
        return $this->type;
    }

    /**
     * Get the column type
     *
     * @see Column::getType (alias)
     *
     * @return string
     */
    public function getDataType()
    {
        return $this->getType();
    }

    /**
     * Set the column length
     *
     * @param int $length
     *
     * @return Column
     */
    public function setLength($length)
    {
        $this->length = (int) $length;

        return $this;
    }

    /**
     * Get the column length
     *
     * @return int
     */
    public function getLength()
    {
        return $this->length;
    }

    /**
     * Sets column type
     *
     * Ex: int(11), varchar(255), enum(1,2,3)
     *
     * @param $type
     */
    public function setColumnType($type)
    {
        $this->columnType = $type;
    }

    /**
     * Gets column type
     *
     * @return string
     */
    public function getColumnType()
    {
        return $this->columnType;
    }

    /**
     * Whether the columns only accepts unsigned values
     *
     * @return bool
     */
    public function isUnsigned()
    {
        $type = $this->getColumnType();

        return strpos($type, 'unsigned') !== false;
    }

    /**
     * Whether the columns has zero fill attribute
     *
     * @return bool
     */
    public function hasZeroFill()
    {
        $type = $this->getColumnType();

        return strpos($type, 'zerofill') !== false;
    }

    /**
     * Set the column length
     *
     * @param int $length
     *
     * @return Column
     */
    public function setCharLength($length)
    {
        return $this->setLength($length);
    }

    /**
     * Get the column length
     *
     * @return int
     */
    public function getCharLength()
    {
        return $this->getLength();
    }

    /**
     * Set column precision
     *
     * @param int $precision
     *
     * @return Column
     */
    public function setPrecision($precision)
    {
        $this->precision = (int) $precision;

        return $this;
    }

    /**
     * Get column precision
     *
     * @return int
     */
    public function getPrecision()
    {
        return $this->precision;
    }

    /**
     * Set column scale
     *
     * @param $scale
     *
     * @return Column
     */
    public function setScale($scale)
    {
        $this->scale = (int) $scale;

        return $this;
    }

    /**
     * Get column scale
     *
     * @return int
     */
    public function getScale()
    {
        return $this->scale;
    }

    /**
     * Set column ordinal position
     *
     * @param $sort
     *
     * @return Column
     */
    public function setSort($sort)
    {
        $this->sort = (int) $sort;

        return $this;
    }

    /**
     * Get Column ordinal position
     *
     * @return int
     */
    public function getSort()
    {
        return $this->sort;
    }

    /**
     * Set column default value
     *
     * @param $value
     *
     * @return Column
     */
    public function setDefaultValue($value)
    {
        $this->defaultValue = $value;

        return $this;
    }

    /**
     * Get column default value
     *
     * @return mixed
     */
    public function getDefaultValue()
    {
        return $this->defaultValue;
    }

    /**
     * Set whether the column is nullable or not
     *
     * @param $nullable
     *
     * @return Column
     */
    public function setNullable($nullable)
    {
        $this->nullable = (bool) $nullable;

        return $this;
    }

    /**
     * Set whether the column is nullable or not
     *
     * @see Column::setNullable
     *
     * @param $nullable
     *
     * @return Column
     */
    public function setIsNullable($nullable)
    {
        return $this->setNullable($nullable === 'YES');
    }

    /**
     * Get whether the column is nullable or not
     *
     * @return bool
     */
    public function getNullable()
    {
        return $this->nullable;
    }

    /**
     * Get whether the column is nullable or not
     *
     * @see Column::getNullable
     *
     * @return bool
     */
    public function getIsNullable()
    {
        return $this->getNullable();
    }

    /**
     * Get whether the column is nullable or not
     *
     * @see Column::getNullable (alias)
     *
     * @return bool
     */
    public function isNullable()
    {
        return $this->getNullable();
    }

    /**
     * Sets the column key
     *
     * @param $key
     *
     * @return $this
     */
    public function setKey($key)
    {
        $this->key = $key;

        return $this;
    }

    /**
     * Gets the column key
     *
     * @return string
     */
    public function getKey()
    {
        return $this->key;
    }

    /**
     * Sets the column extra
     *
     * @param $extra
     *
     * @return $this
     */
    public function setExtra($extra)
    {
        $this->extra = $extra;

        return $this;
    }

    /**
     * Gets the column extra
     *
     * @return string
     */
    public function getExtra()
    {
        return $this->extra;
    }

    /**
     * Gets whether or not the column has auto increment
     *
     * @return bool
     */
    public function hasAutoIncrement()
    {
        return strtolower($this->getExtra() ?: '') === 'auto_increment';
    }

    /**
     * Checks whether is the column a primary key
     *
     * @return bool
     */
    public function isPrimary()
    {
        return strtoupper($this->key) === 'PRI';
    }

    /**
     * Checks whether is the column unique
     *
     * @return bool
     */
    public function isUnique()
    {
        return strtoupper($this->key) === 'UNI';
    }

    /**
     * Set whether the column is required or not
     *
     * @param $required
     *
     * @return Column
     */
    public function setRequired($required)
    {
        $this->required = (bool) $required;

        return $this;
    }

    /**
     * Get whether the column is required or not
     *
     * @return bool
     */
    public function getRequired()
    {
        return $this->required;
    }

    /**
     * Get whether the column is required or not
     *
     * @see Column::getRequired
     *
     * @return bool
     */
    public function isRequired()
    {
        return $this->getRequired();
    }

    public function setUI($name)
    {
        $this->ui = $name;
    }

    public function getUI()
    {
        return $this->ui;
    }

    /**
     * Sets the column options
     *
     * @param array $options
     */
    public function setOptions(array $options)
    {
        $this->options = $options;
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
        $options = $this->options ?: [];

        if ($key !== null) {
            return ArrayUtils::get($options, $key);
        }

        return $options;
    }

    /**
     * Get whether the column must be hidden in lists
     *
     * @see Column::getHiddenList (alias)
     *
     * @return bool
     */
    public function isHiddenList()
    {
        return $this->hiddenList;
    }

    /**
     * Set whether the column must be hidden in forms
     *
     * @param $hidden
     *
     * @return Column
     */
    public function setHiddenInput($hidden)
    {
        $this->hiddenInput = (bool) $hidden;

        return $this;
    }

    /**
     * Get whether the column must be hidden in forms
     *
     * @return bool
     */
    public function getHiddenInput()
    {
        return $this->hiddenInput;
    }

    /**
     * Get whether the column must be hidden in forms
     *
     * @see Column::getHiddenInput
     *
     * @return bool
     */
    public function isHiddenInput()
    {
        return $this->getHiddenInput();
    }

    /**
     * Set the column relationship
     *
     * @param ColumnRelationship|array $relationship
     *
     * @return Column
     */
    public function setRelationship($relationship)
    {
        // Relationship can be pass as an array
        if (!($relationship instanceof ColumnRelationship)) {
            $relationship = new ColumnRelationship($relationship);
        }

        $this->relationship = $relationship;

        return $this;
    }

    /**
     * Get the column relationship
     *
     * @return ColumnRelationship
     */
    public function getRelationship()
    {
        return $this->relationship;
    }

    /**
     * Checks whether the column has relationship
     *
     * @return bool
     */
    public function hasRelationship()
    {
        return $this->relationship ? true : false;
    }

    /**
     * Gets the column relationship type
     *
     * @return null|string
     */
    public function getRelationshipType()
    {
        if ($this->hasRelationship()) {
            return $this->getRelationship()->getType();
        }

        return null;
    }

    /**
     * Set the column comment
     *
     * @param $comment
     *
     * @return Column
     */
    public function setComment($comment)
    {
        $this->comment = $comment;

        return $this;
    }

    /**
     * Get the column comment
     *
     * @return null|string
     */
    public function getComment()
    {
        return $this->comment;
    }

    /**
     * Set the table name the column belongs to
     *
     * @param $name
     */
    public function setTableName($name)
    {
        $this->tableName = $name;
    }

    /**
     * Get the table name the column belongs to
     *
     * @return string
     */
    public function getTableName()
    {
        return $this->tableName;
    }

    /**
     * Checks whether the column is an alias
     *
     * @return bool
     */
    public function isAlias()
    {
        $isLegacyAliasType = in_array($this->getType(), [
            static::ALIAS,
            ColumnRelationship::ONE_TO_MANY,
            ColumnRelationship::MANY_TO_MANY
        ]);

        return $isLegacyAliasType || $this->isToMany();
    }

    /**
     * Set whether or not is a system column
     *
     * @param bool $system
     *
     * @return Column
     */
    public function setSystem($system)
    {
        $this->system = (bool) $system;

        return $this;
    }

    /**
     * Whether or not is a system column
     *
     * @return bool
     */
    public function getSystem()
    {
        return $this->system;
    }

    /**
     * Checks whether the column is a system column
     *
     * @return bool
     */
    public function isSystem()
    {
        return (bool) $this->getSystem();
    }

    /**
     * Checks whether this column is date system interface
     *
     * @return bool
     */
    public function isSystemDate()
    {
        return in_array($this->getUI(), [
            SchemaManager::INTERFACE_DATE_CREATED,
            SchemaManager::INTERFACE_DATE_MODIFIED
        ]);
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
     * Checks whether the relatiopship is MANY TO MANY
     *
     * @return bool
     */
    public function isManyToMany()
    {
        return $this->hasRelationship() ? $this->getRelationship()->isManyToMany() : false;
    }

    /**
     * Checks whether the relatiopship is ONE TO MANY
     *
     * @return bool
     */
    public function isOneToMany()
    {
        return $this->hasRelationship() ? $this->getRelationship()->isOneToMany() : false;
    }

    /**
     * Checks whether the column has ONE/MANY TO MANY Relationship
     *
     * @return bool
     */
    public function isToMany()
    {
        return $this->isOneToMany() || $this->isManyToMany();
    }

    public function toArray()
    {
        $data = $this->propertyArray();

        $relationship = $this->hasRelationship() ? $data['relationship'] : [];

        $data['relationship_type'] = ArrayUtils::get($relationship, 'type', null);
        $data['related_table'] = ArrayUtils::get($relationship, 'related_table', null);
        $data['junction_table'] = ArrayUtils::get($relationship, 'junction_table', null);
        $data['junction_key_right'] = ArrayUtils::get($relationship, 'junction_key_right', null);
        $data['junction_key_left'] = ArrayUtils::get($relationship, 'junction_key_left', null);

        return $data;
    }

    /**
     * @inheritDoc
     */
    function jsonSerialize()
    {
        return $this->toArray();
    }
}
