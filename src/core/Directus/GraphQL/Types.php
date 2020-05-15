<?php
namespace Directus\GraphQL;

use Directus\GraphQL\Type\Directus\DirectusActivityType;
use Directus\GraphQL\Type\Directus\DirectusCollectionType;
use Directus\GraphQL\Type\Directus\DirectusCollectionPresetType;
use Directus\GraphQL\Type\Directus\DirectusFieldType;
use Directus\GraphQL\Type\Directus\DirectusFileType;
use Directus\GraphQL\Type\Directus\DirectusFileThumbnailType;
use Directus\GraphQL\Type\Directus\DirectusFolderType;
use Directus\GraphQL\Type\Directus\DirectusPermissionType;
use Directus\GraphQL\Type\Directus\DirectusRelationType;
use Directus\GraphQL\Type\Directus\DirectusRevisionType;
use Directus\GraphQL\Type\Directus\DirectusUserType;
use Directus\GraphQL\Type\Directus\DirectusRoleType;
use Directus\GraphQL\Type\Directus\DirectusSettingType;
use Directus\GraphQL\Type\MetaType;
use Directus\GraphQL\Type\CollectionType;
use Directus\GraphQL\Type\FieldsType;
use Directus\GraphQL\Type\QueryType;
use Directus\GraphQL\Type\NodeType;
use Directus\GraphQL\Type\Scalar\DateType;
use Directus\GraphQL\Type\Scalar\TimeType;
use Directus\GraphQL\Type\Scalar\DateTimeType;
use Directus\GraphQL\Type\Scalar\JSONType;
use GraphQL\Type\Definition\ListOfType;
use GraphQL\Type\Definition\NonNull;
use GraphQL\Type\Definition\Type;
use Directus\GraphQL\Type\FiltersType;

class Types
{
    // Directus types.
    private static $directusActivity;
    private static $directusCollection;
    private static $directusCollectionPreset;
    private static $directusField;
    private static $directusFile;
    private static $directusFileThumbnail;
    private static $directusFolder;
    private static $directusPermission;
    private static $directusRelation;
    private static $directusRevision;
    private static $directusUser;
    private static $directusRole;
    private static $directusSetting;

    private static $query;
    private static $meta;
    private static $node;

    //Reference for the list of the user created collection.
    private static $userCollections = [];

    //Reference for the list of the collection.
    private static $collections = [];

    //Reference for the list of the collection.
    private static $filters = [];

    // Custom scalar types
    private static $date;
    private static $time;
    private static $datetime;
    private static $json;

    public static function directusActivity()
    {
        return self::$directusActivity ?: (self::$directusActivity = new DirectusActivityType());
    }

    public static function directusCollection()
    {
        return self::$directusCollection ?: (self::$directusCollection = new DirectusCollectionType());
    }

    public static function directusCollectionPreset()
    {
        return self::$directusCollectionPreset ?: (self::$directusCollectionPreset = new DirectusCollectionPresetType());
    }

    public static function directusField()
    {
        return self::$directusField ?: (self::$directusField = new DirectusFieldType());
    }

    public static function directusFile()
    {
        return self::$directusFile ?: (self::$directusFile = new DirectusFileType());
    }

    public static function directusFileThumbnail()
    {
        return self::$directusFileThumbnail ?: (self::$directusFileThumbnail = new DirectusFileThumbnailType());
    }

    public static function directusFolder()
    {
        return self::$directusFolder ?: (self::$directusFolder = new DirectusFolderType());
    }

    public static function directusPermission()
    {
        return self::$directusPermission ?: (self::$directusPermission = new DirectusPermissionType());
    }

    public static function directusRelation()
    {
        return self::$directusRelation ?: (self::$directusRelation = new DirectusRelationType());
    }

    public static function directusRevision()
    {
        return self::$directusRevision ?: (self::$directusRevision = new DirectusRevisionType());
    }

    public static function directusUser()
    {
        return self::$directusUser ?: (self::$directusUser = new DirectusUserType());
    }

    public static function directusRole()
    {
        return self::$directusRole ?: (self::$directusRole = new DirectusRoleType());
    }

    public static function directusSetting()
    {
        return self::$directusSetting ?: (self::$directusSetting = new DirectusSettingType());
    }

    public static function meta()
    {
        return self::$meta ?: (self::$meta = new MetaType());
    }

    public static function collections($type)
    {
        $key  = is_subclass_of($type, 'GraphQL\Type\Definition\ObjectType') ? $type->name : $type;
        if (!array_key_exists($key, self::$collections)) {
            $collectionType =  new CollectionType($type);
            self::$collections[$key] = $collectionType;
            return $collectionType;
        } else {
            return self::$collections[$key];
        }
    }

    /**
     * This function creates run-time GraphQL type according to user created collections.
     * If the type is already created, we'll return existing object.
     * Else create a new type and add it to array.
     */
    public static function userCollection($collection)
    {
        if (!array_key_exists($collection, self::$userCollections)) {
            $fieldsType =  new FieldsType($collection);
            self::$userCollections[$collection] = $fieldsType;
            return $fieldsType;
        } else {
            return self::$userCollections[$collection];
        }
    }

    public static function filters($collection)
    {
        if (!array_key_exists($collection, self::$filters)) {
            $filter =  new FiltersType($collection);
            self::$filters[$collection] = $filter;
            return $filter;
        } else {
            return self::$filters[$collection];
        }
    }

    /**
     * @return QueryType
     */
    public static function query()
    {
        return self::$query ?: (self::$query = new QueryType());
    }

    // Custom scalar type Date
    public static function date()
    {
        return self::$date ?: (self::$date = new DateType());
    }

    // Custom scalar type Time
    public static function time()
    {
        return self::$time ?: (self::$time = new TimeType());
    }

    // Custom scalar type DateTime
    public static function datetime()
    {
        return self::$datetime ?: (self::$datetime = new DateTimeType());
    }

    // Custom scalar type JSON
    public static function json()
    {
        return self::$json ?: (self::$json = new JSONType());
    }

    // Interface types
    /**
     * @return NodeType
     */
    public static function node()
    {
        return self::$node ?: (self::$node = new NodeType());
    }

    // Add internal types as well for consistent experience
    public static function boolean()
    {
        return Type::boolean();
    }
    /**
     * @return \GraphQL\Type\Definition\FloatType
     */
    public static function float()
    {
        return Type::float();
    }

    /**
     * @return \GraphQL\Type\Definition\IDType
     */
    public static function id()
    {
        return Type::id();
    }
    /**
     * @return \GraphQL\Type\Definition\IntType
     */
    public static function int()
    {
        return Type::int();
    }
    /**
     * @return \GraphQL\Type\Definition\StringType
     */
    public static function string()
    {
        return Type::string();
    }
    /**
     * @param Type $type
     * @return ListOfType
     */
    public static function listOf($type)
    {
        return new ListOfType($type);
    }
    /**
     * @param Type $type
     * @return NonNull
     */
    public static function nonNull($type)
    {
        return new NonNull($type);
    }
}
