<?php

declare(strict_types=1);

namespace GraphQL\Type;

use GraphQL\Language\AST\SchemaDefinitionNode;
use GraphQL\Language\AST\SchemaTypeExtensionNode;
use GraphQL\Type\Definition\Directive;
use GraphQL\Type\Definition\ObjectType;
use GraphQL\Type\Definition\Type;
use GraphQL\Utils\Utils;
use function is_callable;

/**
 * Schema configuration class.
 * Could be passed directly to schema constructor. List of options accepted by **create** method is
 * [described in docs](type-system/schema.md#configuration-options).
 *
 * Usage example:
 *
 *     $config = SchemaConfig::create()
 *         ->setQuery($myQueryType)
 *         ->setTypeLoader($myTypeLoader);
 *
 *     $schema = new Schema($config);
 */
class SchemaConfig
{
    /** @var ObjectType */
    public $query;

    /** @var ObjectType */
    public $mutation;

    /** @var ObjectType */
    public $subscription;

    /** @var Type[]|callable */
    public $types;

    /** @var Directive[] */
    public $directives;

    /** @var callable */
    public $typeLoader;

    /** @var SchemaDefinitionNode */
    public $astNode;

    /** @var bool */
    public $assumeValid;

    /** @var SchemaTypeExtensionNode[] */
    public $extensionASTNodes;

    /**
     * Converts an array of options to instance of SchemaConfig
     * (or just returns empty config when array is not passed).
     *
     * @param mixed[] $options
     *
     * @return SchemaConfig
     *
     * @api
     */
    public static function create(array $options = [])
    {
        $config = new static();

        if (! empty($options)) {
            if (isset($options['query'])) {
                $config->setQuery($options['query']);
            }

            if (isset($options['mutation'])) {
                $config->setMutation($options['mutation']);
            }

            if (isset($options['subscription'])) {
                $config->setSubscription($options['subscription']);
            }

            if (isset($options['types'])) {
                $config->setTypes($options['types']);
            }

            if (isset($options['directives'])) {
                $config->setDirectives($options['directives']);
            }

            if (isset($options['typeLoader'])) {
                Utils::invariant(
                    is_callable($options['typeLoader']),
                    'Schema type loader must be callable if provided but got: %s',
                    Utils::printSafe($options['typeLoader'])
                );
                $config->setTypeLoader($options['typeLoader']);
            }

            if (isset($options['astNode'])) {
                $config->setAstNode($options['astNode']);
            }

            if (isset($options['assumeValid'])) {
                $config->setAssumeValid((bool) $options['assumeValid']);
            }

            if (isset($options['extensionASTNodes'])) {
                $config->setExtensionASTNodes($options['extensionASTNodes']);
            }
        }

        return $config;
    }

    /**
     * @return SchemaDefinitionNode
     */
    public function getAstNode()
    {
        return $this->astNode;
    }

    /**
     * @return SchemaConfig
     */
    public function setAstNode(SchemaDefinitionNode $astNode)
    {
        $this->astNode = $astNode;

        return $this;
    }

    /**
     * @return ObjectType
     *
     * @api
     */
    public function getQuery()
    {
        return $this->query;
    }

    /**
     * @param ObjectType $query
     *
     * @return SchemaConfig
     *
     * @api
     */
    public function setQuery($query)
    {
        $this->query = $query;

        return $this;
    }

    /**
     * @return ObjectType
     *
     * @api
     */
    public function getMutation()
    {
        return $this->mutation;
    }

    /**
     * @param ObjectType $mutation
     *
     * @return SchemaConfig
     *
     * @api
     */
    public function setMutation($mutation)
    {
        $this->mutation = $mutation;

        return $this;
    }

    /**
     * @return ObjectType
     *
     * @api
     */
    public function getSubscription()
    {
        return $this->subscription;
    }

    /**
     * @param ObjectType $subscription
     *
     * @return SchemaConfig
     *
     * @api
     */
    public function setSubscription($subscription)
    {
        $this->subscription = $subscription;

        return $this;
    }

    /**
     * @return Type[]
     *
     * @api
     */
    public function getTypes()
    {
        return $this->types ?: [];
    }

    /**
     * @param Type[]|callable $types
     *
     * @return SchemaConfig
     *
     * @api
     */
    public function setTypes($types)
    {
        $this->types = $types;

        return $this;
    }

    /**
     * @return Directive[]
     *
     * @api
     */
    public function getDirectives()
    {
        return $this->directives ?: [];
    }

    /**
     * @param Directive[] $directives
     *
     * @return SchemaConfig
     *
     * @api
     */
    public function setDirectives(array $directives)
    {
        $this->directives = $directives;

        return $this;
    }

    /**
     * @return callable
     *
     * @api
     */
    public function getTypeLoader()
    {
        return $this->typeLoader;
    }

    /**
     * @return SchemaConfig
     *
     * @api
     */
    public function setTypeLoader(callable $typeLoader)
    {
        $this->typeLoader = $typeLoader;

        return $this;
    }

    /**
     * @return bool
     */
    public function getAssumeValid()
    {
        return $this->assumeValid;
    }

    /**
     * @param bool $assumeValid
     *
     * @return SchemaConfig
     */
    public function setAssumeValid($assumeValid)
    {
        $this->assumeValid = $assumeValid;

        return $this;
    }

    /**
     * @return SchemaTypeExtensionNode[]
     */
    public function getExtensionASTNodes()
    {
        return $this->extensionASTNodes;
    }

    /**
     * @param SchemaTypeExtensionNode[] $extensionASTNodes
     */
    public function setExtensionASTNodes(array $extensionASTNodes)
    {
        $this->extensionASTNodes = $extensionASTNodes;
    }
}
