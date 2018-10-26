1.8.0 / 2018/08/05
==================

* Support for void return types without explicit will (@crellbar)
* Clearer error message for unexpected method calls (@meridius)
* Clearer error message for aggregate exceptions (@meridius)
* More verbose `shouldBeCalledOnce` expectation (@olvlvl)
* Ability to double Throwable, or methods that extend it (@ciaranmcnulty)
* [fixed] Doubling methods where class has additional arguments to interface (@webimpress)
* [fixed] Doubling methods where arguments are nullable but default is not null (@webimpress)
* [fixed] Doubling magic methods on parent class (@dsnopek)
* [fixed] Check method predictions only once (@dontub)
* [fixed] Argument::containingString throwing error when called with non-string (@dcabrejas)

1.7.6 / 2018/04/18
==================

* Allow sebastian/comparator ^3.0 (@sebastianbergmann)

1.7.5 / 2018/02/11
==================

* Support for object return type hints (thanks @greg0ire)

1.7.4 / 2018/02/11
==================

* Fix issues with PHP 7.2 (thanks @greg0ire)
* Support object type hints in PHP 7.2 (thanks @@jansvoboda11)

1.7.3 / 2017/11/24
==================

* Fix SplInfo ClassPatch to work with Symfony 4 (Thanks @gnugat)

1.7.2 / 2017-10-04
==================

* Reverted "check method predictions only once" due to it breaking Spies

1.7.1 / 2017-10-03
==================

* Allow PHP5 keywords methods generation on PHP7 (thanks @bycosta)
* Allow reflection-docblock v4 (thanks @GrahamCampbell)
* Check method predictions only once (thanks @dontub)
* Escape file path sent to \SplFileObjectConstructor when running on Windows (thanks @danmartin-epiphany)

1.7.0 / 2017-03-02
==================

* Add full PHP 7.1 Support (thanks @prolic)
* Allow `sebastian/comparator ^2.0` (thanks @sebastianbergmann)
* Allow `sebastian/recursion-context ^3.0` (thanks @sebastianbergmann)
* Allow `\Error` instances in `ThrowPromise` (thanks @jameshalsall)
* Support `phpspec/phpspect ^3.2` (thanks @Sam-Burns)
* Fix failing builds (thanks @Sam-Burns)

1.6.2 / 2016-11-21
==================

* Added support for detecting @method on interfaces that the class itself implements, or when the stubbed class is an interface itself (thanks @Seldaek)
* Added support for sebastian/recursion-context 2 (thanks @sebastianbergmann)
* Added testing on PHP 7.1 on Travis (thanks @danizord)
* Fixed the usage of the phpunit comparator (thanks @Anyqax)

1.6.1 / 2016-06-07
==================

  * Ignored empty method names in invalid `@method` phpdoc
  * Fixed the mocking of SplFileObject
  * Added compatibility with phpdocumentor/reflection-docblock 3

1.6.0 / 2016-02-15
==================

  * Add Variadics support (thanks @pamil)
  * Add ProphecyComparator for comparing objects that need revealing (thanks @jon-acker)
  * Add ApproximateValueToken (thanks @dantleech)
  * Add support for 'self' and 'parent' return type (thanks @bendavies)
  * Add __invoke to allowed reflectable methods list (thanks @ftrrtf)
  * Updated ExportUtil to reflect the latest changes by Sebastian (thanks @jakari)
  * Specify the required php version for composer (thanks @jakzal)
  * Exclude 'args' in the generated backtrace (thanks @oradwell)
  * Fix code generation for scalar parameters (thanks @trowski)
  * Fix missing sprintf in InvalidArgumentException __construct call (thanks @emmanuelballery)
  * Fix phpdoc for magic methods (thanks @Tobion)
  * Fix PhpDoc for interfaces usage (thanks @ImmRanneft)
  * Prevent final methods from being manually extended (thanks @kamioftea)
  * Enhance exception for invalid argument to ThrowPromise (thanks @Tobion)

1.5.0 / 2015-04-27
==================

  * Add support for PHP7 scalar type hints (thanks @trowski)
  * Add support for PHP7 return types (thanks @trowski)
  * Update internal test suite to support PHP7

1.4.1 / 2015-04-27
==================

  * Fixed bug in closure-based argument tokens (#181)

1.4.0 / 2015-03-27
==================

  * Fixed errors in return type phpdocs (thanks @sobit)
  * Fixed stringifying of hash containing one value (thanks @avant1)
  * Improved clarity of method call expectation exception (thanks @dantleech)
  * Add ability to specify which argument is returned in willReturnArgument (thanks @coderbyheart)
  * Add more information to MethodNotFound exceptions (thanks @ciaranmcnulty)
  * Support for mocking classes with methods that return references (thanks @edsonmedina)
  * Improved object comparison (thanks @whatthejeff)
  * Adopted '^' in composer dependencies (thanks @GrahamCampbell)
  * Fixed non-typehinted arguments being treated as optional (thanks @whatthejeff)
  * Magic methods are now filtered for keywords (thanks @seagoj)
  * More readable errors for failure when expecting single calls (thanks @dantleech)

1.3.1 / 2014-11-17
==================

  * Fix the edge case when failed predictions weren't recorded for `getCheckedPredictions()`

1.3.0 / 2014-11-14
==================

  * Add a way to get checked predictions with `MethodProphecy::getCheckedPredictions()`
  * Fix HHVM compatibility
  * Remove dead code (thanks @stof)
  * Add support for DirectoryIterators (thanks @shanethehat)

1.2.0 / 2014-07-18
==================

  * Added support for doubling magic methods documented in the class phpdoc (thanks @armetiz)
  * Fixed a segfault appearing in some cases (thanks @dmoreaulf)
  * Fixed the doubling of methods with typehints on non-existent classes (thanks @gquemener)
  * Added support for internal classes using keywords as method names (thanks @milan)
  * Added IdenticalValueToken and Argument::is (thanks @florianv)
  * Removed the usage of scalar typehints in HHVM as HHVM 3 does not support them anymore in PHP code (thanks @whatthejeff)

1.1.2 / 2014-01-24
==================

  * Spy automatically promotes spied method call to an expected one

1.1.1 / 2014-01-15
==================

  * Added support for HHVM

1.1.0 / 2014-01-01
==================

  * Changed the generated class names to use a static counter instead of a random number
  * Added a clss patch for ReflectionClass::newInstance to make its argument optional consistently (thanks @docteurklein)
  * Fixed mirroring of classes with typehints on non-existent classes (thanks @docteurklein)
  * Fixed the support of array callables in CallbackPromise and CallbackPrediction (thanks @ciaranmcnulty)
  * Added support for properties in ObjectStateToken (thanks @adrienbrault)
  * Added support for mocking classes with a final constructor (thanks @ciaranmcnulty)
  * Added ArrayEveryEntryToken and Argument::withEveryEntry() (thanks @adrienbrault)
  * Added an exception when trying to prophesize on a final method instead of ignoring silently (thanks @docteurklein)
  * Added StringContainToken and Argument::containingString() (thanks @peterjmit)
  * Added ``shouldNotHaveBeenCalled`` on the MethodProphecy (thanks @ciaranmcnulty)
  * Fixed the comparison of objects in ExactValuetoken (thanks @sstok)
  * Deprecated ``shouldNotBeenCalled`` in favor of ``shouldNotHaveBeenCalled``

1.0.4 / 2013-08-10
==================

  * Better randomness for generated class names (thanks @sstok)
  * Add support for interfaces into TypeToken and Argument::type() (thanks @sstok)
  * Add support for old-style (method name === class name) constructors (thanks @l310 for report)

1.0.3 / 2013-07-04
==================

  * Support callable typehints (thanks @stof)
  * Do not attempt to autoload arrays when generating code (thanks @MarcoDeBortoli)
  * New ArrayEntryToken (thanks @kagux)

1.0.2 / 2013-05-19
==================

  * Logical `AND` token added (thanks @kagux)
  * Logical `NOT` token added (thanks @kagux)
  * Add support for setting custom constructor arguments
  * Properly stringify hashes
  * Record calls that throw exceptions
  * Migrate spec suite to PhpSpec 2.0

1.0.1 / 2013-04-30
==================

  * Fix broken UnexpectedCallException message
  * Trim AggregateException message

1.0.0 / 2013-04-29
==================

  * Improve exception messages

1.0.0-BETA2 / 2013-04-03
========================

  * Add more debug information to CallTimes and Call prediction exception messages
  * Fix MethodNotFoundException wrong namespace (thanks @gunnarlium)
  * Fix some typos in the exception messages (thanks @pborreli)

1.0.0-BETA1 / 2013-03-25
========================

  * Initial release
