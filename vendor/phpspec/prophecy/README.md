# Prophecy

[![Stable release](https://poser.pugx.org/phpspec/prophecy/version.svg)](https://packagist.org/packages/phpspec/prophecy)
[![Build Status](https://travis-ci.org/phpspec/prophecy.svg?branch=master)](https://travis-ci.org/phpspec/prophecy)

Prophecy is a highly opinionated yet very powerful and flexible PHP object mocking
framework. Though initially it was created to fulfil phpspec2 needs, it is flexible
enough to be used inside any testing framework out there with minimal effort.

## A simple example

```php
<?php

class UserTest extends PHPUnit_Framework_TestCase
{
    private $prophet;

    public function testPasswordHashing()
    {
        $hasher = $this->prophet->prophesize('App\Security\Hasher');
        $user   = new App\Entity\User($hasher->reveal());

        $hasher->generateHash($user, 'qwerty')->willReturn('hashed_pass');

        $user->setPassword('qwerty');

        $this->assertEquals('hashed_pass', $user->getPassword());
    }

    protected function setup()
    {
        $this->prophet = new \Prophecy\Prophet;
    }

    protected function tearDown()
    {
        $this->prophet->checkPredictions();
    }
}
```

## Installation

### Prerequisites

Prophecy requires PHP 5.3.3 or greater.

### Setup through composer

First, add Prophecy to the list of dependencies inside your `composer.json`:

```json
{
    "require-dev": {
        "phpspec/prophecy": "~1.0"
    }
}
```

Then simply install it with composer:

```bash
$> composer install --prefer-dist
```

You can read more about Composer on its [official webpage](http://getcomposer.org).

## How to use it

First of all, in Prophecy every word has a logical meaning, even the name of the library
itself (Prophecy). When you start feeling that, you'll become very fluid with this
tool.

For example, Prophecy has been named that way because it concentrates on describing the future
behavior of objects with very limited knowledge about them. But as with any other prophecy,
those object prophecies can't create themselves - there should be a Prophet:

```php
$prophet = new Prophecy\Prophet;
```

The Prophet creates prophecies by *prophesizing* them:

```php
$prophecy = $prophet->prophesize();
```

The result of the `prophesize()` method call is a new object of class `ObjectProphecy`. Yes,
that's your specific object prophecy, which describes how your object would behave
in the near future. But first, you need to specify which object you're talking about,
right?

```php
$prophecy->willExtend('stdClass');
$prophecy->willImplement('SessionHandlerInterface');
```

There are 2 interesting calls - `willExtend` and `willImplement`. The first one tells
object prophecy that our object should extend specific class, the second one says that
it should implement some interface. Obviously, objects in PHP can implement multiple
interfaces, but extend only one parent class.

### Dummies

Ok, now we have our object prophecy. What can we do with it? First of all, we can get
our object *dummy* by revealing its prophecy:

```php
$dummy = $prophecy->reveal();
```

The `$dummy` variable now holds a special dummy object. Dummy objects are objects that extend
and/or implement preset classes/interfaces by overriding all their public methods. The key
point about dummies is that they do not hold any logic - they just do nothing. Any method
of the dummy will always return `null` and the dummy will never throw any exceptions.
Dummy is your friend if you don't care about the actual behavior of this double and just need
a token object to satisfy a method typehint.

You need to understand one thing - a dummy is not a prophecy. Your object prophecy is still
assigned to `$prophecy` variable and in order to manipulate with your expectations, you
should work with it. `$dummy` is a dummy - a simple php object that tries to fulfil your
prophecy.

### Stubs

Ok, now we know how to create basic prophecies and reveal dummies from them. That's
awesome if we don't care about our _doubles_ (objects that reflect originals)
interactions. If we do, we need to use *stubs* or *mocks*.

A stub is an object double, which doesn't have any expectations about the object behavior,
but when put in specific environment, behaves in specific way. Ok, I know, it's cryptic,
but bear with me for a minute. Simply put, a stub is a dummy, which depending on the called
method signature does different things (has logic). To create stubs in Prophecy:

```php
$prophecy->read('123')->willReturn('value');
```

Oh wow. We've just made an arbitrary call on the object prophecy? Yes, we did. And this
call returned us a new object instance of class `MethodProphecy`. Yep, that's a specific
method with arguments prophecy. Method prophecies give you the ability to create method
promises or predictions. We'll talk about method predictions later in the _Mocks_ section.

#### Promises

Promises are logical blocks, that represent your fictional methods in prophecy terms
and they are handled by the `MethodProphecy::will(PromiseInterface $promise)` method.
As a matter of fact, the call that we made earlier (`willReturn('value')`) is a simple
shortcut to:

```php
$prophecy->read('123')->will(new Prophecy\Promise\ReturnPromise(array('value')));
```

This promise will cause any call to our double's `read()` method with exactly one
argument - `'123'` to always return `'value'`. But that's only for this
promise, there's plenty others you can use:

- `ReturnPromise` or `->willReturn(1)` - returns a value from a method call
- `ReturnArgumentPromise` or `->willReturnArgument($index)` - returns the nth method argument from call
- `ThrowPromise` or `->willThrow($exception)` - causes the method to throw specific exception
- `CallbackPromise` or `->will($callback)` - gives you a quick way to define your own custom logic

Keep in mind, that you can always add even more promises by implementing
`Prophecy\Promise\PromiseInterface`.

#### Method prophecies idempotency

Prophecy enforces same method prophecies and, as a consequence, same promises and
predictions for the same method calls with the same arguments. This means:

```php
$methodProphecy1 = $prophecy->read('123');
$methodProphecy2 = $prophecy->read('123');
$methodProphecy3 = $prophecy->read('321');

$methodProphecy1 === $methodProphecy2;
$methodProphecy1 !== $methodProphecy3;
```

That's interesting, right? Now you might ask me how would you define more complex
behaviors where some method call changes behavior of others. In PHPUnit or Mockery
you do that by predicting how many times your method will be called. In Prophecy,
you'll use promises for that:

```php
$user->getName()->willReturn(null);

// For PHP 5.4
$user->setName('everzet')->will(function () {
    $this->getName()->willReturn('everzet');
});

// For PHP 5.3
$user->setName('everzet')->will(function ($args, $user) {
    $user->getName()->willReturn('everzet');
});

// Or
$user->setName('everzet')->will(function ($args) use ($user) {
    $user->getName()->willReturn('everzet');
});
```

And now it doesn't matter how many times or in which order your methods are called.
What matters is their behaviors and how well you faked it.

#### Arguments wildcarding

The previous example is awesome (at least I hope it is for you), but that's not
optimal enough. We hardcoded `'everzet'` in our expectation. Isn't there a better
way? In fact there is, but it involves understanding what this `'everzet'`
actually is.

You see, even if method arguments used during method prophecy creation look
like simple method arguments, in reality they are not. They are argument token
wildcards.  As a matter of fact, `->setName('everzet')` looks like a simple call just
because Prophecy automatically transforms it under the hood into:

```php
$user->setName(new Prophecy\Argument\Token\ExactValueToken('everzet'));
```

Those argument tokens are simple PHP classes, that implement
`Prophecy\Argument\Token\TokenInterface` and tell Prophecy how to compare real arguments
with your expectations. And yes, those classnames are damn big. That's why there's a
shortcut class `Prophecy\Argument`, which you can use to create tokens like that:

```php
use Prophecy\Argument;

$user->setName(Argument::exact('everzet'));
```

`ExactValueToken` is not very useful in our case as it forced us to hardcode the username.
That's why Prophecy comes bundled with a bunch of other tokens:

- `IdenticalValueToken` or `Argument::is($value)` - checks that the argument is identical to a specific value
- `ExactValueToken` or `Argument::exact($value)` - checks that the argument matches a specific value
- `TypeToken` or `Argument::type($typeOrClass)` - checks that the argument matches a specific type or
  classname
- `ObjectStateToken` or `Argument::which($method, $value)` - checks that the argument method returns
  a specific value
- `CallbackToken` or `Argument::that(callback)` - checks that the argument matches a custom callback
- `AnyValueToken` or `Argument::any()` - matches any argument
- `AnyValuesToken` or `Argument::cetera()` - matches any arguments to the rest of the signature
- `StringContainsToken` or `Argument::containingString($value)` - checks that the argument contains a specific string value

And you can add even more by implementing `TokenInterface` with your own custom classes.

So, let's refactor our initial `{set,get}Name()` logic with argument tokens:

```php
use Prophecy\Argument;

$user->getName()->willReturn(null);

// For PHP 5.4
$user->setName(Argument::type('string'))->will(function ($args) {
    $this->getName()->willReturn($args[0]);
});

// For PHP 5.3
$user->setName(Argument::type('string'))->will(function ($args, $user) {
    $user->getName()->willReturn($args[0]);
});

// Or
$user->setName(Argument::type('string'))->will(function ($args) use ($user) {
    $user->getName()->willReturn($args[0]);
});
```

That's it. Now our `{set,get}Name()` prophecy will work with any string argument provided to it.
We've just described how our stub object should behave, even though the original object could have
no behavior whatsoever.

One last bit about arguments now. You might ask, what happens in case of:

```php
use Prophecy\Argument;

$user->getName()->willReturn(null);

// For PHP 5.4
$user->setName(Argument::type('string'))->will(function ($args) {
    $this->getName()->willReturn($args[0]);
});

// For PHP 5.3
$user->setName(Argument::type('string'))->will(function ($args, $user) {
    $user->getName()->willReturn($args[0]);
});

// Or
$user->setName(Argument::type('string'))->will(function ($args) use ($user) {
    $user->getName()->willReturn($args[0]);
});

$user->setName(Argument::any())->will(function () {
});
```

Nothing. Your stub will continue behaving the way it did before. That's because of how
arguments wildcarding works. Every argument token type has a different score level, which
wildcard then uses to calculate the final arguments match score and use the method prophecy
promise that has the highest score. In this case, `Argument::type()` in case of success
scores `5` and `Argument::any()` scores `3`. So the type token wins, as does the first
`setName()` method prophecy and its promise. The simple rule of thumb - more precise token
always wins.

#### Getting stub objects

Ok, now we know how to define our prophecy method promises, let's get our stub from
it:

```php
$stub = $prophecy->reveal();
```

As you might see, the only difference between how we get dummies and stubs is that with
stubs we describe every object conversation instead of just agreeing with `null` returns
(object being *dummy*). As a matter of fact, after you define your first promise
(method call), Prophecy will force you to define all the communications - it throws
the `UnexpectedCallException` for any call you didn't describe with object prophecy before
calling it on a stub.

### Mocks

Now we know how to define doubles without behavior (dummies) and doubles with behavior, but
no expectations (stubs). What's left is doubles for which we have some expectations. These
are called mocks and in Prophecy they look almost exactly the same as stubs, except that
they define *predictions* instead of *promises* on method prophecies:

```php
$entityManager->flush()->shouldBeCalled();
```

#### Predictions

The `shouldBeCalled()` method here assigns `CallPrediction` to our method prophecy.
Predictions are a delayed behavior check for your prophecies. You see, during the entire lifetime
of your doubles, Prophecy records every single call you're making against it inside your
code. After that, Prophecy can use this collected information to check if it matches defined
predictions. You can assign predictions to method prophecies using the
`MethodProphecy::should(PredictionInterface $prediction)` method. As a matter of fact,
the `shouldBeCalled()` method we used earlier is just a shortcut to:

```php
$entityManager->flush()->should(new Prophecy\Prediction\CallPrediction());
```

It checks if your method of interest (that matches both the method name and the arguments wildcard)
was called 1 or more times. If the prediction failed then it throws an exception. When does this
check happen? Whenever you call `checkPredictions()` on the main Prophet object:

```php
$prophet->checkPredictions();
```

In PHPUnit, you would want to put this call into the `tearDown()` method. If no predictions
are defined, it would do nothing. So it won't harm to call it after every test.

There are plenty more predictions you can play with:

- `CallPrediction` or `shouldBeCalled()` - checks that the method has been called 1 or more times
- `NoCallsPrediction` or `shouldNotBeCalled()` - checks that the method has not been called
- `CallTimesPrediction` or `shouldBeCalledTimes($count)` - checks that the method has been called
  `$count` times
- `CallbackPrediction` or `should($callback)` - checks the method against your own custom callback

Of course, you can always create your own custom prediction any time by implementing
`PredictionInterface`.

### Spies

The last bit of awesomeness in Prophecy is out-of-the-box spies support. As I said in the previous
section, Prophecy records every call made during the double's entire lifetime. This means
you don't need to record predictions in order to check them. You can also do it
manually by using the `MethodProphecy::shouldHave(PredictionInterface $prediction)` method:

```php
$em = $prophet->prophesize('Doctrine\ORM\EntityManager');

$controller->createUser($em->reveal());

$em->flush()->shouldHaveBeenCalled();
```

Such manipulation with doubles is called spying. And with Prophecy it just works.
