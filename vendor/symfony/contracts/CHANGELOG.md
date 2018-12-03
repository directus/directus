CHANGELOG
=========

1.0.0
-----

 * added `Service\ResetInterface` to provide a way to reset an object to its initial state
 * added `Translation\TranslatorInterface` and `Translation\TranslatorTrait`
 * added `Cache` contract to extend PSR-6 with tag invalidation, callback-based computation and stampede protection
 * added `Service\ServiceSubscriberInterface` to declare the dependencies of a class that consumes a service locator
 * added `Service\ServiceSubscriberTrait` to implement `Service\ServiceSubscriberInterface` using methods' return types
 * added `Service\ServiceLocatorTrait` to help implement PSR-11 service locators
