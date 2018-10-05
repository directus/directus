CHANGELOG
=========

3.4.0
-----

 * added support for validation groups to the `Valid` constraint
 * not setting the `strict` option of the `Choice` constraint to `true` is
   deprecated and will throw an exception in Symfony 4.0
 * setting the `checkDNS` option of the `Url` constraint to `true` is deprecated in favor of
   the `Url::CHECK_DNS_TYPE_*` constants values and will throw an exception in Symfony 4.0
 * added min/max amount of pixels check to `Image` constraint via `minPixels` and `maxPixels`
 * added a new "propertyPath" option to comparison constraints in order to get the value to compare from an array or object

3.3.0
-----

 * added `AddValidatorInitializersPass`
 * added `AddConstraintValidatorsPass`
 * added `ContainerConstraintValidatorFactory`

3.2.0
-----

 * deprecated `Tests\Constraints\AbstractContraintValidatorTest` in favor of `Test\ConstraintValidatorTestCase`
 * added support for PHP constants in YAML configuration files

3.1.0
-----

 * deprecated `DateTimeValidator::PATTERN` constant
 * added a `format` option to the `DateTime` constraint

2.8.0
-----

 * added the BIC (SWIFT-Code) validator

2.7.0
-----

 * deprecated `DefaultTranslator` in favor of `Symfony\Component\Translation\IdentityTranslator`
 * deprecated PHP7-incompatible constraints (Null, True, False) and related validators (NullValidator, TrueValidator, FalseValidator) in favor of their `Is`-prefixed equivalent

2.6.0
-----

 * [BC BREAK] `FileValidator` disallow empty files
 * [BC BREAK] `UserPasswordValidator` source message change
 * [BC BREAK] added internal `ExecutionContextInterface::setConstraint()`
 * added `ConstraintViolation::getConstraint()`
 * [BC BREAK] The `ExpressionValidator` will now evaluate the Expression even when the property value is null or an empty string
 * deprecated `ClassMetadata::hasMemberMetadatas()`
 * deprecated `ClassMetadata::getMemberMetadatas()`
 * deprecated `ClassMetadata::addMemberMetadata()`
 * [BC BREAK] added `Mapping\MetadataInterface::getConstraints()`
 * added generic "payload" option to all constraints for attaching domain-specific data
 * [BC BREAK] added `ConstraintViolationBuilderInterface::setCause()`

2.5.0
-----

 * deprecated `ApcCache` in favor of `DoctrineCache`
 * added `DoctrineCache` to adapt any Doctrine cache
 * `GroupSequence` now implements `ArrayAccess`, `Countable` and `Traversable`
 * [BC BREAK] changed `ClassMetadata::getGroupSequence()` to return a `GroupSequence` instance instead of an array
 * `Callback` can now be put onto properties (useful when you pass a closure to the constraint)
 * deprecated `ClassBasedInterface`
 * deprecated `MetadataInterface`
 * deprecated `PropertyMetadataInterface`
 * deprecated `PropertyMetadataContainerInterface`
 * deprecated `Mapping\ElementMetadata`
 * added `Mapping\MetadataInterface`
 * added `Mapping\ClassMetadataInterface`
 * added `Mapping\PropertyMetadataInterface`
 * added `Mapping\GenericMetadata`
 * added `Mapping\CascadingStrategy`
 * added `Mapping\TraversalStrategy`
 * deprecated `Mapping\ClassMetadata::accept()`
 * deprecated `Mapping\MemberMetadata::accept()`
 * removed array type hint of `Mapping\ClassMetadata::setGroupSequence()`
 * deprecated `MetadataFactoryInterface`
 * deprecated `Mapping\BlackholeMetadataFactory`
 * deprecated `Mapping\ClassMetadataFactory`
 * added `Mapping\Factory\MetadataFactoryInterface`
 * added `Mapping\Factory\BlackHoleMetadataFactory`
 * added `Mapping\Factory\LazyLoadingMetadataFactory`
 * deprecated `ExecutionContextInterface`
 * deprecated `ExecutionContext`
 * deprecated `GlobalExecutionContextInterface`
 * added `Context\ExecutionContextInterface`
 * added `Context\ExecutionContext`
 * added `Context\ExecutionContextFactoryInterface`
 * added `Context\ExecutionContextFactory`
 * deprecated `ValidatorInterface`
 * deprecated `Validator`
 * deprecated `ValidationVisitorInterface`
 * deprecated `ValidationVisitor`
 * added `Validator\ValidatorInterface`
 * added `Validator\RecursiveValidator`
 * added `Validator\ContextualValidatorInterface`
 * added `Validator\RecursiveContextualValidator`
 * added `Violation\ConstraintViolationBuilderInterface`
 * added `Violation\ConstraintViolationBuilder`
 * added `ConstraintViolation::getParameters()`
 * added `ConstraintViolation::getPlural()`
 * added `Constraints\Traverse`
 * deprecated `$deep` property in `Constraints\Valid`
 * added `ValidatorBuilderInterface::setApiVersion()`
 * added `Validation::API_VERSION_2_4`
 * added `Validation::API_VERSION_2_5`
 * added `Exception\OutOfBoundsException`
 * added `Exception\UnsupportedMetadataException`
 * made `Exception\ValidatorException` extend `Exception\RuntimeException`
 * added `Util\PropertyPath`
 * made the PropertyAccess component an optional dependency
 * deprecated `ValidatorBuilder::setPropertyAccessor()`
 * deprecated `validate` and `validateValue` on `Validator\Context\ExecutionContext` use `getValidator()` together with `inContext()` instead

2.4.0
-----

 * added a constraint the uses the expression language
 * added `minRatio`, `maxRatio`, `allowSquare`, `allowLandscape`, and `allowPortrait` to Image validator

2.3.29
------

 * fixed compatibility with PHP7 and up by introducing new constraints (IsNull, IsTrue, IsFalse) and related validators (IsNullValidator, IsTrueValidator, IsFalseValidator)

2.3.0
-----

 * added the ISBN, ISSN, and IBAN validators
 * copied the constraints `Optional` and `Required` to the
   `Symfony\Component\Validator\Constraints\` namespace and deprecated the original
   classes.
 * added comparison validators (EqualTo, NotEqualTo, LessThan, LessThanOrEqualTo, GreaterThan, GreaterThanOrEqualTo, IdenticalTo, NotIdenticalTo)

2.2.0
-----

 * added a CardScheme validator
 * added a Luhn validator
 * moved @api-tags from `Validator` to `ValidatorInterface`
 * moved @api-tags from `ConstraintViolation` to the new `ConstraintViolationInterface`
 * moved @api-tags from `ConstraintViolationList` to the new `ConstraintViolationListInterface`
 * moved @api-tags from `ExecutionContext` to the new `ExecutionContextInterface`
 * [BC BREAK] `ConstraintValidatorInterface::initialize` is now type hinted against `ExecutionContextInterface` instead of `ExecutionContext`
 * [BC BREAK] changed the visibility of the properties in `Validator` from protected to private
 * deprecated `ClassMetadataFactoryInterface` in favor of the new `MetadataFactoryInterface`
 * deprecated `ClassMetadataFactory::getClassMetadata` in favor of `getMetadataFor`
 * created `MetadataInterface`, `PropertyMetadataInterface`, `ClassBasedInterface` and `PropertyMetadataContainerInterface`
 * deprecated `GraphWalker` in favor of the new `ValidationVisitorInterface`
 * deprecated `ExecutionContext::addViolationAtPath`
 * deprecated `ExecutionContext::addViolationAtSubPath` in favor of `ExecutionContextInterface::addViolationAt`
 * deprecated `ExecutionContext::getCurrentClass` in favor of `ExecutionContextInterface::getClassName`
 * deprecated `ExecutionContext::getCurrentProperty` in favor of `ExecutionContextInterface::getPropertyName`
 * deprecated `ExecutionContext::getCurrentValue` in favor of `ExecutionContextInterface::getValue`
 * deprecated `ExecutionContext::getGraphWalker` in favor of `ExecutionContextInterface::validate` and `ExecutionContextInterface::validateValue`
 * improved `ValidatorInterface::validateValue` to accept arrays of constraints
 * changed `ValidatorInterface::getMetadataFactory` to return a `MetadataFactoryInterface` instead of a `ClassMetadataFactoryInterface`
 * removed `ClassMetadataFactoryInterface` type hint from `ValidatorBuilderInterface::setMetadataFactory`.
   As of Symfony 2.3, this method will be typed against `MetadataFactoryInterface` instead.
 * [BC BREAK] the switches `traverse` and `deep` in the `Valid` constraint and in `GraphWalker::walkReference`
   are ignored for arrays now. Arrays are always traversed recursively.
 * added dependency to Translation component
 * violation messages are now translated with a TranslatorInterface implementation
 * [BC BREAK] inserted argument `$message` in the constructor of `ConstraintViolation`
 * [BC BREAK] inserted arguments `$translator` and `$translationDomain` in the constructor of `ExecutionContext`
 * [BC BREAK] inserted arguments `$translator` and `$translationDomain` in the constructor of `GraphWalker`
 * [BC BREAK] inserted arguments `$translator` and `$translationDomain` in the constructor of `ValidationVisitor`
 * [BC BREAK] inserted arguments `$translator` and `$translationDomain` in the constructor of `Validator`
 * [BC BREAK] added `setTranslator()` and `setTranslationDomain()` to `ValidatorBuilderInterface`
 * improved the Validator to support pluralized messages by default
 * [BC BREAK] changed the source of all pluralized messages in the translation files to the pluralized version
 * added ExceptionInterface, BadMethodCallException and InvalidArgumentException

2.1.0
-----

 * added support for `ctype_*` assertions in `TypeValidator`
 * improved the ImageValidator with min width, max width, min height, and max height constraints
 * added support for MIME with wildcard in FileValidator
 * changed Collection validator to add "missing" and "extra" errors to
   individual fields
 * changed default value for `extraFieldsMessage` and `missingFieldsMessage`
   in Collection constraint
 * made ExecutionContext immutable
 * deprecated Constraint methods `setMessage`, `getMessageTemplate` and
   `getMessageParameters`
 * added support for dynamic group sequences with the GroupSequenceProvider pattern
 * [BC BREAK] ConstraintValidatorInterface method `isValid` has been renamed to
   `validate`, its return value was dropped. ConstraintValidator still contains
   `isValid` for BC
 * [BC BREAK] collections in fields annotated with `Valid` are not traversed
   recursively anymore by default. `Valid` contains a new property `deep`
   which enables the BC behavior.
 * added Count constraint
 * added Length constraint
 * added Range constraint
 * deprecated the Min and Max constraints
 * deprecated the MinLength and MaxLength constraints
 * added Validation and ValidatorBuilderInterface
 * deprecated ValidatorContext, ValidatorContextInterface and ValidatorFactory
