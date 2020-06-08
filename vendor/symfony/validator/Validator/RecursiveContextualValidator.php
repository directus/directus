<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Validator;

use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\Constraints\Composite;
use Symfony\Component\Validator\Constraints\Existence;
use Symfony\Component\Validator\Constraints\GroupSequence;
use Symfony\Component\Validator\Constraints\Valid;
use Symfony\Component\Validator\ConstraintValidatorFactoryInterface;
use Symfony\Component\Validator\Context\ExecutionContext;
use Symfony\Component\Validator\Context\ExecutionContextInterface;
use Symfony\Component\Validator\Exception\ConstraintDefinitionException;
use Symfony\Component\Validator\Exception\NoSuchMetadataException;
use Symfony\Component\Validator\Exception\RuntimeException;
use Symfony\Component\Validator\Exception\UnsupportedMetadataException;
use Symfony\Component\Validator\Exception\ValidatorException;
use Symfony\Component\Validator\Mapping\CascadingStrategy;
use Symfony\Component\Validator\Mapping\ClassMetadataInterface;
use Symfony\Component\Validator\Mapping\Factory\MetadataFactoryInterface;
use Symfony\Component\Validator\Mapping\GenericMetadata;
use Symfony\Component\Validator\Mapping\GetterMetadata;
use Symfony\Component\Validator\Mapping\MetadataInterface;
use Symfony\Component\Validator\Mapping\PropertyMetadataInterface;
use Symfony\Component\Validator\Mapping\TraversalStrategy;
use Symfony\Component\Validator\ObjectInitializerInterface;
use Symfony\Component\Validator\Util\PropertyPath;

/**
 * Recursive implementation of {@link ContextualValidatorInterface}.
 *
 * @author Bernhard Schussek <bschussek@gmail.com>
 */
class RecursiveContextualValidator implements ContextualValidatorInterface
{
    private $context;
    private $defaultPropertyPath;
    private $defaultGroups;
    private $metadataFactory;
    private $validatorFactory;
    private $objectInitializers;

    /**
     * Creates a validator for the given context.
     *
     * @param ExecutionContextInterface           $context            The execution context
     * @param MetadataFactoryInterface            $metadataFactory    The factory for
     *                                                                fetching the metadata
     *                                                                of validated objects
     * @param ConstraintValidatorFactoryInterface $validatorFactory   The factory for creating
     *                                                                constraint validators
     * @param ObjectInitializerInterface[]        $objectInitializers The object initializers
     */
    public function __construct(ExecutionContextInterface $context, MetadataFactoryInterface $metadataFactory, ConstraintValidatorFactoryInterface $validatorFactory, array $objectInitializers = [])
    {
        $this->context = $context;
        $this->defaultPropertyPath = $context->getPropertyPath();
        $this->defaultGroups = [$context->getGroup() ?: Constraint::DEFAULT_GROUP];
        $this->metadataFactory = $metadataFactory;
        $this->validatorFactory = $validatorFactory;
        $this->objectInitializers = $objectInitializers;
    }

    /**
     * {@inheritdoc}
     */
    public function atPath($path)
    {
        $this->defaultPropertyPath = $this->context->getPropertyPath($path);

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function validate($value, $constraints = null, $groups = null)
    {
        $groups = $groups ? $this->normalizeGroups($groups) : $this->defaultGroups;

        $previousValue = $this->context->getValue();
        $previousObject = $this->context->getObject();
        $previousMetadata = $this->context->getMetadata();
        $previousPath = $this->context->getPropertyPath();
        $previousGroup = $this->context->getGroup();
        $previousConstraint = null;

        if ($this->context instanceof ExecutionContext || method_exists($this->context, 'getConstraint')) {
            $previousConstraint = $this->context->getConstraint();
        }

        // If explicit constraints are passed, validate the value against
        // those constraints
        if (null !== $constraints) {
            // You can pass a single constraint or an array of constraints
            // Make sure to deal with an array in the rest of the code
            if (!\is_array($constraints)) {
                $constraints = [$constraints];
            }

            $metadata = new GenericMetadata();
            $metadata->addConstraints($constraints);

            $this->validateGenericNode(
                $value,
                $previousObject,
                \is_object($value) ? spl_object_hash($value) : null,
                $metadata,
                $this->defaultPropertyPath,
                $groups,
                null,
                TraversalStrategy::IMPLICIT,
                $this->context
            );

            $this->context->setNode($previousValue, $previousObject, $previousMetadata, $previousPath);
            $this->context->setGroup($previousGroup);

            if (null !== $previousConstraint) {
                $this->context->setConstraint($previousConstraint);
            }

            return $this;
        }

        // If an object is passed without explicit constraints, validate that
        // object against the constraints defined for the object's class
        if (\is_object($value)) {
            $this->validateObject(
                $value,
                $this->defaultPropertyPath,
                $groups,
                TraversalStrategy::IMPLICIT,
                $this->context
            );

            $this->context->setNode($previousValue, $previousObject, $previousMetadata, $previousPath);
            $this->context->setGroup($previousGroup);

            return $this;
        }

        // If an array is passed without explicit constraints, validate each
        // object in the array
        if (\is_array($value)) {
            $this->validateEachObjectIn(
                $value,
                $this->defaultPropertyPath,
                $groups,
                $this->context
            );

            $this->context->setNode($previousValue, $previousObject, $previousMetadata, $previousPath);
            $this->context->setGroup($previousGroup);

            return $this;
        }

        throw new RuntimeException(sprintf('Cannot validate values of type "%s" automatically. Please provide a constraint.', \gettype($value)));
    }

    /**
     * {@inheritdoc}
     */
    public function validateProperty($object, $propertyName, $groups = null)
    {
        $classMetadata = $this->metadataFactory->getMetadataFor($object);

        if (!$classMetadata instanceof ClassMetadataInterface) {
            throw new ValidatorException(sprintf('The metadata factory should return instances of "\Symfony\Component\Validator\Mapping\ClassMetadataInterface", got: "%s".', \is_object($classMetadata) ? \get_class($classMetadata) : \gettype($classMetadata)));
        }

        $propertyMetadatas = $classMetadata->getPropertyMetadata($propertyName);
        $groups = $groups ? $this->normalizeGroups($groups) : $this->defaultGroups;
        $cacheKey = spl_object_hash($object);
        $propertyPath = PropertyPath::append($this->defaultPropertyPath, $propertyName);

        $previousValue = $this->context->getValue();
        $previousObject = $this->context->getObject();
        $previousMetadata = $this->context->getMetadata();
        $previousPath = $this->context->getPropertyPath();
        $previousGroup = $this->context->getGroup();

        foreach ($propertyMetadatas as $propertyMetadata) {
            $propertyValue = $propertyMetadata->getPropertyValue($object);

            $this->validateGenericNode(
                $propertyValue,
                $object,
                $cacheKey.':'.\get_class($object).':'.$propertyName,
                $propertyMetadata,
                $propertyPath,
                $groups,
                null,
                TraversalStrategy::IMPLICIT,
                $this->context
            );
        }

        $this->context->setNode($previousValue, $previousObject, $previousMetadata, $previousPath);
        $this->context->setGroup($previousGroup);

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function validatePropertyValue($objectOrClass, $propertyName, $value, $groups = null)
    {
        $classMetadata = $this->metadataFactory->getMetadataFor($objectOrClass);

        if (!$classMetadata instanceof ClassMetadataInterface) {
            throw new ValidatorException(sprintf('The metadata factory should return instances of "\Symfony\Component\Validator\Mapping\ClassMetadataInterface", got: "%s".', \is_object($classMetadata) ? \get_class($classMetadata) : \gettype($classMetadata)));
        }

        $propertyMetadatas = $classMetadata->getPropertyMetadata($propertyName);
        $groups = $groups ? $this->normalizeGroups($groups) : $this->defaultGroups;

        if (\is_object($objectOrClass)) {
            $object = $objectOrClass;
            $class = \get_class($object);
            $cacheKey = spl_object_hash($objectOrClass);
            $propertyPath = PropertyPath::append($this->defaultPropertyPath, $propertyName);
        } else {
            // $objectOrClass contains a class name
            $object = null;
            $class = $objectOrClass;
            $cacheKey = null;
            $propertyPath = $this->defaultPropertyPath;
        }

        $previousValue = $this->context->getValue();
        $previousObject = $this->context->getObject();
        $previousMetadata = $this->context->getMetadata();
        $previousPath = $this->context->getPropertyPath();
        $previousGroup = $this->context->getGroup();

        foreach ($propertyMetadatas as $propertyMetadata) {
            $this->validateGenericNode(
                $value,
                $object,
                $cacheKey.':'.$class.':'.$propertyName,
                $propertyMetadata,
                $propertyPath,
                $groups,
                null,
                TraversalStrategy::IMPLICIT,
                $this->context
            );
        }

        $this->context->setNode($previousValue, $previousObject, $previousMetadata, $previousPath);
        $this->context->setGroup($previousGroup);

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function getViolations()
    {
        return $this->context->getViolations();
    }

    /**
     * Normalizes the given group or list of groups to an array.
     *
     * @param string|GroupSequence|(string|GroupSequence)[] $groups The groups to normalize
     *
     * @return (string|GroupSequence)[] A group array
     */
    protected function normalizeGroups($groups)
    {
        if (\is_array($groups)) {
            return $groups;
        }

        return [$groups];
    }

    /**
     * Validates an object against the constraints defined for its class.
     *
     * If no metadata is available for the class, but the class is an instance
     * of {@link \Traversable} and the selected traversal strategy allows
     * traversal, the object will be iterated and each nested object will be
     * validated instead.
     *
     * @param object                    $object            The object to cascade
     * @param string                    $propertyPath      The current property path
     * @param (string|GroupSequence)[]  $groups            The validated groups
     * @param int                       $traversalStrategy The strategy for traversing the
     *                                                     cascaded object
     * @param ExecutionContextInterface $context           The current execution context
     *
     * @throws NoSuchMetadataException      If the object has no associated metadata
     *                                      and does not implement {@link \Traversable}
     *                                      or if traversal is disabled via the
     *                                      $traversalStrategy argument
     * @throws UnsupportedMetadataException If the metadata returned by the
     *                                      metadata factory does not implement
     *                                      {@link ClassMetadataInterface}
     */
    private function validateObject($object, $propertyPath, array $groups, $traversalStrategy, ExecutionContextInterface $context)
    {
        try {
            $classMetadata = $this->metadataFactory->getMetadataFor($object);

            if (!$classMetadata instanceof ClassMetadataInterface) {
                throw new UnsupportedMetadataException(sprintf('The metadata factory should return instances of "Symfony\Component\Validator\Mapping\ClassMetadataInterface", got: "%s".', \is_object($classMetadata) ? \get_class($classMetadata) : \gettype($classMetadata)));
            }

            $this->validateClassNode(
                $object,
                spl_object_hash($object),
                $classMetadata,
                $propertyPath,
                $groups,
                null,
                $traversalStrategy,
                $context
            );
        } catch (NoSuchMetadataException $e) {
            // Rethrow if not Traversable
            if (!$object instanceof \Traversable) {
                throw $e;
            }

            // Rethrow unless IMPLICIT or TRAVERSE
            if (!($traversalStrategy & (TraversalStrategy::IMPLICIT | TraversalStrategy::TRAVERSE))) {
                throw $e;
            }

            $this->validateEachObjectIn(
                $object,
                $propertyPath,
                $groups,
                $context
            );
        }
    }

    /**
     * Validates each object in a collection against the constraints defined
     * for their classes.
     *
     * Nested arrays are also iterated.
     *
     * @param iterable                  $collection   The collection
     * @param string                    $propertyPath The current property path
     * @param (string|GroupSequence)[]  $groups       The validated groups
     * @param ExecutionContextInterface $context      The current execution context
     */
    private function validateEachObjectIn($collection, $propertyPath, array $groups, ExecutionContextInterface $context)
    {
        foreach ($collection as $key => $value) {
            if (\is_array($value)) {
                // Also traverse nested arrays
                $this->validateEachObjectIn(
                    $value,
                    $propertyPath.'['.$key.']',
                    $groups,
                    $context
                );

                continue;
            }

            // Scalar and null values in the collection are ignored
            if (\is_object($value)) {
                $this->validateObject(
                    $value,
                    $propertyPath.'['.$key.']',
                    $groups,
                    TraversalStrategy::IMPLICIT,
                    $context
                );
            }
        }
    }

    /**
     * Validates a class node.
     *
     * A class node is a combination of an object with a {@link ClassMetadataInterface}
     * instance. Each class node (conceptionally) has zero or more succeeding
     * property nodes:
     *
     *     (Article:class node)
     *                \
     *        ($title:property node)
     *
     * This method validates the passed objects against all constraints defined
     * at class level. It furthermore triggers the validation of each of the
     * class' properties against the constraints for that property.
     *
     * If the selected traversal strategy allows traversal, the object is
     * iterated and each nested object is validated against its own constraints.
     * The object is not traversed if traversal is disabled in the class
     * metadata.
     *
     * If the passed groups contain the group "Default", the validator will
     * check whether the "Default" group has been replaced by a group sequence
     * in the class metadata. If this is the case, the group sequence is
     * validated instead.
     *
     * @param object                    $object            The validated object
     * @param string                    $cacheKey          The key for caching
     *                                                     the validated object
     * @param ClassMetadataInterface    $metadata          The class metadata of
     *                                                     the object
     * @param string                    $propertyPath      The property path leading
     *                                                     to the object
     * @param (string|GroupSequence)[]  $groups            The groups in which the
     *                                                     object should be validated
     * @param string[]|null             $cascadedGroups    The groups in which
     *                                                     cascaded objects should
     *                                                     be validated
     * @param int                       $traversalStrategy The strategy used for
     *                                                     traversing the object
     * @param ExecutionContextInterface $context           The current execution context
     *
     * @throws UnsupportedMetadataException  If a property metadata does not
     *                                       implement {@link PropertyMetadataInterface}
     * @throws ConstraintDefinitionException If traversal was enabled but the
     *                                       object does not implement
     *                                       {@link \Traversable}
     *
     * @see TraversalStrategy
     */
    private function validateClassNode($object, $cacheKey, ClassMetadataInterface $metadata = null, $propertyPath, array $groups, $cascadedGroups, $traversalStrategy, ExecutionContextInterface $context)
    {
        $context->setNode($object, $object, $metadata, $propertyPath);

        if (!$context->isObjectInitialized($cacheKey)) {
            foreach ($this->objectInitializers as $initializer) {
                $initializer->initialize($object);
            }

            $context->markObjectAsInitialized($cacheKey);
        }

        foreach ($groups as $key => $group) {
            // If the "Default" group is replaced by a group sequence, remember
            // to cascade the "Default" group when traversing the group
            // sequence
            $defaultOverridden = false;

            // Use the object hash for group sequences
            $groupHash = \is_object($group) ? spl_object_hash($group) : $group;

            if ($context->isGroupValidated($cacheKey, $groupHash)) {
                // Skip this group when validating the properties and when
                // traversing the object
                unset($groups[$key]);

                continue;
            }

            $context->markGroupAsValidated($cacheKey, $groupHash);

            // Replace the "Default" group by the group sequence defined
            // for the class, if applicable.
            // This is done after checking the cache, so that
            // spl_object_hash() isn't called for this sequence and
            // "Default" is used instead in the cache. This is useful
            // if the getters below return different group sequences in
            // every call.
            if (Constraint::DEFAULT_GROUP === $group) {
                if ($metadata->hasGroupSequence()) {
                    // The group sequence is statically defined for the class
                    $group = $metadata->getGroupSequence();
                    $defaultOverridden = true;
                } elseif ($metadata->isGroupSequenceProvider()) {
                    // The group sequence is dynamically obtained from the validated
                    // object
                    /* @var \Symfony\Component\Validator\GroupSequenceProviderInterface $object */
                    $group = $object->getGroupSequence();
                    $defaultOverridden = true;

                    if (!$group instanceof GroupSequence) {
                        $group = new GroupSequence($group);
                    }
                }
            }

            // If the groups (=[<G1,G2>,G3,G4]) contain a group sequence
            // (=<G1,G2>), then call validateClassNode() with each entry of the
            // group sequence and abort if necessary (G1, G2)
            if ($group instanceof GroupSequence) {
                $this->stepThroughGroupSequence(
                     $object,
                     $object,
                     $cacheKey,
                     $metadata,
                     $propertyPath,
                     $traversalStrategy,
                     $group,
                     $defaultOverridden ? Constraint::DEFAULT_GROUP : null,
                     $context
                );

                // Skip the group sequence when validating properties, because
                // stepThroughGroupSequence() already validates the properties
                unset($groups[$key]);

                continue;
            }

            $this->validateInGroup($object, $cacheKey, $metadata, $group, $context);
        }

        // If no more groups should be validated for the property nodes,
        // we can safely quit
        if (0 === \count($groups)) {
            return;
        }

        // Validate all properties against their constraints
        foreach ($metadata->getConstrainedProperties() as $propertyName) {
            // If constraints are defined both on the getter of a property as
            // well as on the property itself, then getPropertyMetadata()
            // returns two metadata objects, not just one
            foreach ($metadata->getPropertyMetadata($propertyName) as $propertyMetadata) {
                if (!$propertyMetadata instanceof PropertyMetadataInterface) {
                    throw new UnsupportedMetadataException(sprintf('The property metadata instances should implement "Symfony\Component\Validator\Mapping\PropertyMetadataInterface", got: "%s".', \is_object($propertyMetadata) ? \get_class($propertyMetadata) : \gettype($propertyMetadata)));
                }

                if ($propertyMetadata instanceof GetterMetadata) {
                    $propertyValue = new LazyProperty(static function () use ($propertyMetadata, $object) {
                        return $propertyMetadata->getPropertyValue($object);
                    });
                } else {
                    $propertyValue = $propertyMetadata->getPropertyValue($object);
                }

                $this->validateGenericNode(
                    $propertyValue,
                    $object,
                    $cacheKey.':'.\get_class($object).':'.$propertyName,
                    $propertyMetadata,
                    PropertyPath::append($propertyPath, $propertyName),
                    $groups,
                    $cascadedGroups,
                    TraversalStrategy::IMPLICIT,
                    $context
                );
            }
        }

        // If no specific traversal strategy was requested when this method
        // was called, use the traversal strategy of the class' metadata
        if ($traversalStrategy & TraversalStrategy::IMPLICIT) {
            $traversalStrategy = $metadata->getTraversalStrategy();
        }

        // Traverse only if IMPLICIT or TRAVERSE
        if (!($traversalStrategy & (TraversalStrategy::IMPLICIT | TraversalStrategy::TRAVERSE))) {
            return;
        }

        // If IMPLICIT, stop unless we deal with a Traversable
        if ($traversalStrategy & TraversalStrategy::IMPLICIT && !$object instanceof \Traversable) {
            return;
        }

        // If TRAVERSE, fail if we have no Traversable
        if (!$object instanceof \Traversable) {
            throw new ConstraintDefinitionException(sprintf('Traversal was enabled for "%s", but this class does not implement "\Traversable".', \get_class($object)));
        }

        $this->validateEachObjectIn(
            $object,
            $propertyPath,
            $groups,
            $context
        );
    }

    /**
     * Validates a node that is not a class node.
     *
     * Currently, two such node types exist:
     *
     *  - property nodes, which consist of the value of an object's
     *    property together with a {@link PropertyMetadataInterface} instance
     *  - generic nodes, which consist of a value and some arbitrary
     *    constraints defined in a {@link MetadataInterface} container
     *
     * In both cases, the value is validated against all constraints defined
     * in the passed metadata object. Then, if the value is an instance of
     * {@link \Traversable} and the selected traversal strategy permits it,
     * the value is traversed and each nested object validated against its own
     * constraints. If the value is an array, it is traversed regardless of
     * the given strategy.
     *
     * @param mixed                     $value             The validated value
     * @param object|null               $object            The current object
     * @param string                    $cacheKey          The key for caching
     *                                                     the validated value
     * @param MetadataInterface         $metadata          The metadata of the
     *                                                     value
     * @param string                    $propertyPath      The property path leading
     *                                                     to the value
     * @param (string|GroupSequence)[]  $groups            The groups in which the
     *                                                     value should be validated
     * @param string[]|null             $cascadedGroups    The groups in which
     *                                                     cascaded objects should
     *                                                     be validated
     * @param int                       $traversalStrategy The strategy used for
     *                                                     traversing the value
     * @param ExecutionContextInterface $context           The current execution context
     *
     * @see TraversalStrategy
     */
    private function validateGenericNode($value, $object, $cacheKey, MetadataInterface $metadata = null, $propertyPath, array $groups, $cascadedGroups, $traversalStrategy, ExecutionContextInterface $context)
    {
        $context->setNode($value, $object, $metadata, $propertyPath);

        foreach ($groups as $key => $group) {
            if ($group instanceof GroupSequence) {
                $this->stepThroughGroupSequence(
                     $value,
                     $object,
                     $cacheKey,
                     $metadata,
                     $propertyPath,
                     $traversalStrategy,
                     $group,
                     null,
                     $context
                );

                // Skip the group sequence when cascading, as the cascading
                // logic is already done in stepThroughGroupSequence()
                unset($groups[$key]);

                continue;
            }

            $this->validateInGroup($value, $cacheKey, $metadata, $group, $context);
        }

        if (0 === \count($groups)) {
            return;
        }

        if (null === $value) {
            return;
        }

        $cascadingStrategy = $metadata->getCascadingStrategy();

        // Quit unless we cascade
        if (!($cascadingStrategy & CascadingStrategy::CASCADE)) {
            return;
        }

        // If no specific traversal strategy was requested when this method
        // was called, use the traversal strategy of the node's metadata
        if ($traversalStrategy & TraversalStrategy::IMPLICIT) {
            $traversalStrategy = $metadata->getTraversalStrategy();
        }

        // The $cascadedGroups property is set, if the "Default" group is
        // overridden by a group sequence
        // See validateClassNode()
        $cascadedGroups = null !== $cascadedGroups && \count($cascadedGroups) > 0 ? $cascadedGroups : $groups;

        if ($value instanceof LazyProperty) {
            $value = $value->getPropertyValue();
        }

        if (\is_array($value)) {
            // Arrays are always traversed, independent of the specified
            // traversal strategy
            $this->validateEachObjectIn(
                $value,
                $propertyPath,
                $cascadedGroups,
                $context
            );

            return;
        }

        // If the value is a scalar, pass it anyway, because we want
        // a NoSuchMetadataException to be thrown in that case
        $this->validateObject(
            $value,
            $propertyPath,
            $cascadedGroups,
            $traversalStrategy,
            $context
        );

        // Currently, the traversal strategy can only be TRAVERSE for a
        // generic node if the cascading strategy is CASCADE. Thus, traversable
        // objects will always be handled within validateObject() and there's
        // nothing more to do here.

        // see GenericMetadata::addConstraint()
    }

    /**
     * Sequentially validates a node's value in each group of a group sequence.
     *
     * If any of the constraints generates a violation, subsequent groups in the
     * group sequence are skipped.
     *
     * @param mixed                     $value             The validated value
     * @param object|null               $object            The current object
     * @param string                    $cacheKey          The key for caching
     *                                                     the validated value
     * @param MetadataInterface         $metadata          The metadata of the
     *                                                     value
     * @param string                    $propertyPath      The property path leading
     *                                                     to the value
     * @param int                       $traversalStrategy The strategy used for
     *                                                     traversing the value
     * @param GroupSequence             $groupSequence     The group sequence
     * @param string|null               $cascadedGroup     The group that should
     *                                                     be passed to cascaded
     *                                                     objects instead of
     *                                                     the group sequence
     * @param ExecutionContextInterface $context           The execution context
     */
    private function stepThroughGroupSequence($value, $object, $cacheKey, MetadataInterface $metadata = null, $propertyPath, $traversalStrategy, GroupSequence $groupSequence, $cascadedGroup, ExecutionContextInterface $context)
    {
        $violationCount = \count($context->getViolations());
        $cascadedGroups = $cascadedGroup ? [$cascadedGroup] : null;

        foreach ($groupSequence->groups as $groupInSequence) {
            $groups = (array) $groupInSequence;

            if ($metadata instanceof ClassMetadataInterface) {
                $this->validateClassNode(
                     $value,
                     $cacheKey,
                     $metadata,
                     $propertyPath,
                     $groups,
                     $cascadedGroups,
                     $traversalStrategy,
                     $context
                );
            } else {
                $this->validateGenericNode(
                     $value,
                     $object,
                     $cacheKey,
                     $metadata,
                     $propertyPath,
                     $groups,
                     $cascadedGroups,
                     $traversalStrategy,
                     $context
                );
            }

            // Abort sequence validation if a violation was generated
            if (\count($context->getViolations()) > $violationCount) {
                break;
            }
        }
    }

    /**
     * Validates a node's value against all constraints in the given group.
     *
     * @param mixed                     $value    The validated value
     * @param string                    $cacheKey The key for caching the
     *                                            validated value
     * @param MetadataInterface         $metadata The metadata of the value
     * @param string                    $group    The group to validate
     * @param ExecutionContextInterface $context  The execution context
     */
    private function validateInGroup($value, $cacheKey, MetadataInterface $metadata, $group, ExecutionContextInterface $context)
    {
        $context->setGroup($group);

        foreach ($metadata->findConstraints($group) as $constraint) {
            if ($constraint instanceof Existence) {
                continue;
            }

            // Prevent duplicate validation of constraints, in the case
            // that constraints belong to multiple validated groups
            if (null !== $cacheKey) {
                $constraintHash = spl_object_hash($constraint);
                // instanceof Valid: In case of using a Valid constraint with many groups
                // it makes a reference object get validated by each group
                if ($constraint instanceof Composite || $constraint instanceof Valid) {
                    $constraintHash .= $group;
                }

                if ($context->isConstraintValidated($cacheKey, $constraintHash)) {
                    continue;
                }

                $context->markConstraintAsValidated($cacheKey, $constraintHash);
            }

            $context->setConstraint($constraint);

            $validator = $this->validatorFactory->getInstance($constraint);
            $validator->initialize($context);

            if ($value instanceof LazyProperty) {
                $value = $value->getPropertyValue();
            }

            $validator->validate($value, $constraint);
        }
    }
}
