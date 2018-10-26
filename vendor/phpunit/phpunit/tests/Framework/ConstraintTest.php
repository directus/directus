<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Framework_ConstraintTest extends PHPUnit_Framework_TestCase
{
    public function testConstraintArrayHasKey()
    {
        $constraint = PHPUnit_Framework_Assert::arrayHasKey(0);

        $this->assertFalse($constraint->evaluate([], '', true));
        $this->assertEquals('has the key 0', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate([]);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(<<<EOF
Failed asserting that an array has the key 0.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintArrayHasKey2()
    {
        $constraint = PHPUnit_Framework_Assert::arrayHasKey(0);

        try {
            $constraint->evaluate([], 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
custom message\nFailed asserting that an array has the key 0.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintArrayNotHasKey()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::arrayHasKey(0)
        );

        $this->assertFalse($constraint->evaluate([0 => 1], '', true));
        $this->assertEquals('does not have the key 0', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate([0 => 1]);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that an array does not have the key 0.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintArrayNotHasKey2()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::arrayHasKey(0)
        );

        try {
            $constraint->evaluate([0], 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
custom message
Failed asserting that an array does not have the key 0.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintIsReadable()
    {
        $constraint = PHPUnit_Framework_Assert::isReadable();

        $this->assertFalse($constraint->evaluate('foo', '', true));
        $this->assertEquals('is readable', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate('foo');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
                <<<EOF
Failed asserting that "foo" is readable.

EOF
                ,
                PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintIsWritable()
    {
        $constraint = PHPUnit_Framework_Assert::isWritable();

        $this->assertFalse($constraint->evaluate('foo', '', true));
        $this->assertEquals('is writable', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate('foo');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
                <<<EOF
Failed asserting that "foo" is writable.

EOF
                ,
                PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintDirectoryExists()
    {
        $constraint = PHPUnit_Framework_Assert::directoryExists();

        $this->assertFalse($constraint->evaluate('foo', '', true));
        $this->assertEquals('directory exists', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate('foo');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
                <<<EOF
Failed asserting that directory "foo" exists.

EOF
                ,
                PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintFileExists()
    {
        $constraint = PHPUnit_Framework_Assert::fileExists();

        $this->assertFalse($constraint->evaluate('foo', '', true));
        $this->assertEquals('file exists', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate('foo');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that file "foo" exists.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintFileExists2()
    {
        $constraint = PHPUnit_Framework_Assert::fileExists();

        try {
            $constraint->evaluate('foo', 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(<<<EOF
custom message
Failed asserting that file "foo" exists.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintFileNotExists()
    {
        $file = dirname(__DIR__) . DIRECTORY_SEPARATOR . '_files' . DIRECTORY_SEPARATOR . 'ClassWithNonPublicAttributes.php';

        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::fileExists()
        );

        $this->assertFalse($constraint->evaluate($file, '', true));
        $this->assertEquals('file does not exist', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate($file);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that file "$file" does not exist.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintFileNotExists2()
    {
        $file = dirname(__DIR__) . DIRECTORY_SEPARATOR . '_files' . DIRECTORY_SEPARATOR . 'ClassWithNonPublicAttributes.php';

        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::fileExists()
        );

        try {
            $constraint->evaluate($file, 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(<<<EOF
custom message
Failed asserting that file "$file" does not exist.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintGreaterThan()
    {
        $constraint = PHPUnit_Framework_Assert::greaterThan(1);

        $this->assertFalse($constraint->evaluate(0, '', true));
        $this->assertTrue($constraint->evaluate(2, '', true));
        $this->assertEquals('is greater than 1', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate(0);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that 0 is greater than 1.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintGreaterThan2()
    {
        $constraint = PHPUnit_Framework_Assert::greaterThan(1);

        try {
            $constraint->evaluate(0, 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
custom message
Failed asserting that 0 is greater than 1.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintNotGreaterThan()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::greaterThan(1)
        );

        $this->assertTrue($constraint->evaluate(1, '', true));
        $this->assertEquals('is not greater than 1', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate(2);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that 2 is not greater than 1.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintNotGreaterThan2()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::greaterThan(1)
        );

        try {
            $constraint->evaluate(2, 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
custom message
Failed asserting that 2 is not greater than 1.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintGreaterThanOrEqual()
    {
        $constraint = PHPUnit_Framework_Assert::greaterThanOrEqual(1);

        $this->assertTrue($constraint->evaluate(1, '', true));
        $this->assertFalse($constraint->evaluate(0, '', true));
        $this->assertEquals('is equal to 1 or is greater than 1', $constraint->toString());
        $this->assertCount(2, $constraint);

        try {
            $constraint->evaluate(0);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that 0 is equal to 1 or is greater than 1.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintGreaterThanOrEqual2()
    {
        $constraint = PHPUnit_Framework_Assert::greaterThanOrEqual(1);

        try {
            $constraint->evaluate(0, 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
custom message
Failed asserting that 0 is equal to 1 or is greater than 1.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintNotGreaterThanOrEqual()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::greaterThanOrEqual(1)
        );

        $this->assertFalse($constraint->evaluate(1, '', true));
        $this->assertEquals('not( is equal to 1 or is greater than 1 )', $constraint->toString());
        $this->assertCount(2, $constraint);

        try {
            $constraint->evaluate(1);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that not( 1 is equal to 1 or is greater than 1 ).

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintNotGreaterThanOrEqual2()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::greaterThanOrEqual(1)
        );

        try {
            $constraint->evaluate(1, 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
custom message
Failed asserting that not( 1 is equal to 1 or is greater than 1 ).

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintIsAnything()
    {
        $constraint = PHPUnit_Framework_Assert::anything();

        $this->assertTrue($constraint->evaluate(null, '', true));
        $this->assertNull($constraint->evaluate(null));
        $this->assertEquals('is anything', $constraint->toString());
        $this->assertCount(0, $constraint);
    }

    public function testConstraintNotIsAnything()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::anything()
        );

        $this->assertFalse($constraint->evaluate(null, '', true));
        $this->assertEquals('is not anything', $constraint->toString());
        $this->assertCount(0, $constraint);

        try {
            $constraint->evaluate(null);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that null is not anything.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintIsEqual()
    {
        $constraint = PHPUnit_Framework_Assert::equalTo(1);

        $this->assertTrue($constraint->evaluate(1, '', true));
        $this->assertFalse($constraint->evaluate(0, '', true));
        $this->assertEquals('is equal to 1', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate(0);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that 0 matches expected 1.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function isEqualProvider()
    {
        $a      = new stdClass;
        $a->foo = 'bar';
        $b      = new stdClass;
        $ahash  = spl_object_hash($a);
        $bhash  = spl_object_hash($b);

        $c               = new stdClass;
        $c->foo          = 'bar';
        $c->int          = 1;
        $c->array        = [0, [1], [2], 3];
        $c->related      = new stdClass;
        $c->related->foo = "a\nb\nc\nd\ne\nf\ng\nh\ni\nj\nk";
        $c->self         = $c;
        $c->c            = $c;
        $d               = new stdClass;
        $d->foo          = 'bar';
        $d->int          = 2;
        $d->array        = [0, [4], [2], 3];
        $d->related      = new stdClass;
        $d->related->foo = "a\np\nc\nd\ne\nf\ng\nh\ni\nw\nk";
        $d->self         = $d;
        $d->c            = $c;

        $storage1 = new SplObjectStorage;
        $storage1->attach($a);
        $storage1->attach($b);
        $storage2 = new SplObjectStorage;
        $storage2->attach($b);
        $storage1hash = spl_object_hash($storage1);
        $storage2hash = spl_object_hash($storage2);

        $dom1                     = new DOMDocument;
        $dom1->preserveWhiteSpace = false;
        $dom1->loadXML('<root></root>');
        $dom2                     = new DOMDocument;
        $dom2->preserveWhiteSpace = false;
        $dom2->loadXML('<root><foo/></root>');

        $data = [
            [1, 0, <<<EOF
Failed asserting that 0 matches expected 1.

EOF
            ],
            [1.1, 0, <<<EOF
Failed asserting that 0 matches expected 1.1.

EOF
            ],
            ['a', 'b', <<<EOF
Failed asserting that two strings are equal.
--- Expected
+++ Actual
@@ @@
-'a'
+'b'

EOF
            ],
            ["a\nb\nc\nd\ne\nf\ng\nh\ni\nj\nk", "a\np\nc\nd\ne\nf\ng\nh\ni\nw\nk", <<<EOF
Failed asserting that two strings are equal.
--- Expected
+++ Actual
@@ @@
 'a
-b
+p
@@ @@
 i
-j
+w
 k'

EOF
            ],
            [1, [0], <<<EOF
Array (...) does not match expected type "integer".

EOF
            ],
            [[0], 1, <<<EOF
1 does not match expected type "array".

EOF
            ],
            [[0], [1], <<<EOF
Failed asserting that two arrays are equal.
--- Expected
+++ Actual
@@ @@
 Array (
-    0 => 0
+    0 => 1
 )

EOF
            ],
            [[true], ['true'], <<<EOF
Failed asserting that two arrays are equal.
--- Expected
+++ Actual
@@ @@
 Array (
-    0 => true
+    0 => 'true'
 )

EOF
            ],
            [[0, [1], [2], 3], [0, [4], [2], 3], <<<EOF
Failed asserting that two arrays are equal.
--- Expected
+++ Actual
@@ @@
 Array (
     0 => 0
     1 => Array (
-        0 => 1
+        0 => 4
     )
     2 => Array (...)
     3 => 3
 )

EOF
            ],
            [$a, [0], <<<EOF
Array (...) does not match expected type "object".

EOF
            ],
            [[0], $a, <<<EOF
stdClass Object (...) does not match expected type "array".

EOF
            ],
            [$a, $b, <<<EOF
Failed asserting that two objects are equal.
--- Expected
+++ Actual
@@ @@
 stdClass Object (
-    'foo' => 'bar'
 )

EOF
            ],
            [$c, $d, <<<EOF
Failed asserting that two objects are equal.
--- Expected
+++ Actual
@@ @@
 stdClass Object (
     'foo' => 'bar'
-    'int' => 1
+    'int' => 2
     'array' => Array (
         0 => 0
         1 => Array (
-            0 => 1
+            0 => 4
@@ @@
         'foo' => 'a
-        b
+        p
@@ @@
         i
-        j
+        w
         k'
     )
     'self' => stdClass Object (...)
     'c' => stdClass Object (...)
 )

EOF
            ],
            [$dom1, $dom2, <<<EOF
Failed asserting that two DOM documents are equal.
--- Expected
+++ Actual
@@ @@
 <?xml version="1.0"?>
-<root/>
+<root>
+  <foo/>
+</root>

EOF
            ],
            [
              new DateTime('2013-03-29 04:13:35', new DateTimeZone('America/New_York')),
              new DateTime('2013-03-29 04:13:35', new DateTimeZone('America/Chicago')),
              <<<EOF
Failed asserting that two DateTime objects are equal.
--- Expected
+++ Actual
@@ @@
-2013-03-29T04:13:35.000000-0400
+2013-03-29T04:13:35.000000-0500

EOF
            ],
        ];

        if (PHP_MAJOR_VERSION < 7) {
            $data[] = [$storage1, $storage2, <<<EOF
Failed asserting that two objects are equal.
--- Expected
+++ Actual
@@ @@
-SplObjectStorage Object &$storage1hash (
-    '$ahash' => Array &0 (
-        'obj' => stdClass Object &$ahash (
-            'foo' => 'bar'
-        )
-        'inf' => null
-    )
-    '$bhash' => Array &1 (
+SplObjectStorage Object &$storage2hash (
+    '$bhash' => Array &0 (
         'obj' => stdClass Object &$bhash ()
         'inf' => null
     )
 )

EOF
            ];
        } else {
            $data[] = [$storage1, $storage2, <<<EOF
Failed asserting that two objects are equal.
--- Expected
+++ Actual
@@ @@
-SplObjectStorage Object &$storage1hash (
-    '$ahash' => Array &0 (
-        'obj' => stdClass Object &$ahash (
-            'foo' => 'bar'
-        )
-        'inf' => null
-    )
-    '$bhash' => Array &1 (
+SplObjectStorage Object &$storage2hash (
+    '$bhash' => Array &0 (
         'obj' => stdClass Object &$bhash ()
         'inf' => null
     )
 )

EOF
            ];
        }

        return $data;
    }

    /**
     * @dataProvider isEqualProvider
     */
    public function testConstraintIsEqual2($expected, $actual, $message)
    {
        $constraint = PHPUnit_Framework_Assert::equalTo($expected);

        try {
            $constraint->evaluate($actual, 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              "custom message\n$message",
              $this->trimnl(PHPUnit_Framework_TestFailure::exceptionToString($e))
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintIsNotEqual()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::equalTo(1)
        );

        $this->assertTrue($constraint->evaluate(0, '', true));
        $this->assertFalse($constraint->evaluate(1, '', true));
        $this->assertEquals('is not equal to 1', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate(1);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that 1 is not equal to 1.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintIsNotEqual2()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::equalTo(1)
        );

        try {
            $constraint->evaluate(1, 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
custom message
Failed asserting that 1 is not equal to 1.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintIsIdentical()
    {
        $a = new stdClass;
        $b = new stdClass;

        $constraint = PHPUnit_Framework_Assert::identicalTo($a);

        $this->assertFalse($constraint->evaluate($b, '', true));
        $this->assertTrue($constraint->evaluate($a, '', true));
        $this->assertEquals('is identical to an object of class "stdClass"', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate($b);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(<<<EOF
Failed asserting that two variables reference the same object.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintIsIdentical2()
    {
        $a = new stdClass;
        $b = new stdClass;

        $constraint = PHPUnit_Framework_Assert::identicalTo($a);

        try {
            $constraint->evaluate($b, 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(<<<EOF
custom message
Failed asserting that two variables reference the same object.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintIsIdentical3()
    {
        $constraint = PHPUnit_Framework_Assert::identicalTo('a');

        try {
            $constraint->evaluate('b', 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(<<<EOF
custom message
Failed asserting that two strings are identical.
--- Expected
+++ Actual
@@ @@
-a
+b

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintIsNotIdentical()
    {
        $a = new stdClass;
        $b = new stdClass;

        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::identicalTo($a)
        );

        $this->assertTrue($constraint->evaluate($b, '', true));
        $this->assertFalse($constraint->evaluate($a, '', true));
        $this->assertEquals('is not identical to an object of class "stdClass"', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate($a);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(<<<EOF
Failed asserting that two variables don't reference the same object.

EOF
              ,
              $this->trimnl(PHPUnit_Framework_TestFailure::exceptionToString($e))
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintIsNotIdentical2()
    {
        $a = new stdClass;

        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::identicalTo($a)
        );

        try {
            $constraint->evaluate($a, 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(<<<EOF
custom message
Failed asserting that two variables don't reference the same object.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintIsNotIdentical3()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::identicalTo('a')
        );

        try {
            $constraint->evaluate('a', 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(<<<EOF
custom message
Failed asserting that two strings are not identical.

EOF
              ,
              $this->trimnl(PHPUnit_Framework_TestFailure::exceptionToString($e))
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintIsInstanceOf()
    {
        $constraint = PHPUnit_Framework_Assert::isInstanceOf('Exception');

        $this->assertFalse($constraint->evaluate(new stdClass, '', true));
        $this->assertTrue($constraint->evaluate(new Exception, '', true));
        $this->assertEquals('is instance of class "Exception"', $constraint->toString());
        $this->assertCount(1, $constraint);

        $interfaceConstraint = PHPUnit_Framework_Assert::isInstanceOf('Countable');
        $this->assertFalse($interfaceConstraint->evaluate(new stdClass, '', true));
        $this->assertTrue($interfaceConstraint->evaluate(new ArrayObject, '', true));
        $this->assertEquals('is instance of interface "Countable"', $interfaceConstraint->toString());

        try {
            $constraint->evaluate(new stdClass);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that stdClass Object () is an instance of class "Exception".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintIsInstanceOf2()
    {
        $constraint = PHPUnit_Framework_Assert::isInstanceOf('Exception');

        try {
            $constraint->evaluate(new stdClass, 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(<<<EOF
custom message
Failed asserting that stdClass Object () is an instance of class "Exception".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintIsNotInstanceOf()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::isInstanceOf('stdClass')
        );

        $this->assertFalse($constraint->evaluate(new stdClass, '', true));
        $this->assertTrue($constraint->evaluate(new Exception, '', true));
        $this->assertEquals('is not instance of class "stdClass"', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate(new stdClass);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that stdClass Object () is not an instance of class "stdClass".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintIsNotInstanceOf2()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::isInstanceOf('stdClass')
        );

        try {
            $constraint->evaluate(new stdClass, 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(<<<EOF
custom message
Failed asserting that stdClass Object () is not an instance of class "stdClass".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintIsType()
    {
        $constraint = PHPUnit_Framework_Assert::isType('string');

        $this->assertFalse($constraint->evaluate(0, '', true));
        $this->assertTrue($constraint->evaluate('', '', true));
        $this->assertEquals('is of type "string"', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate(new stdClass);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertStringMatchesFormat(<<<EOF
Failed asserting that stdClass Object &%x () is of type "string".

EOF
              ,
              $this->trimnl(PHPUnit_Framework_TestFailure::exceptionToString($e))
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintIsType2()
    {
        $constraint = PHPUnit_Framework_Assert::isType('string');

        try {
            $constraint->evaluate(new stdClass, 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertStringMatchesFormat(<<<EOF
custom message
Failed asserting that stdClass Object &%x () is of type "string".

EOF
              ,
              $this->trimnl(PHPUnit_Framework_TestFailure::exceptionToString($e))
            );

            return;
        }

        $this->fail();
    }

    public function resources()
    {
        $fh = fopen(__FILE__, 'r');
        fclose($fh);

        return [
            'open resource'     => [fopen(__FILE__, 'r')],
            'closed resource'   => [$fh],
        ];
    }

    /**
     * @dataProvider resources
     */
    public function testConstraintIsResourceTypeEvaluatesCorrectlyWithResources($resource)
    {
        $constraint = PHPUnit_Framework_Assert::isType('resource');

        $this->assertTrue($constraint->evaluate($resource, '', true));

        @fclose($resource);
    }

    public function testConstraintIsNotType()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::isType('string')
        );

        $this->assertTrue($constraint->evaluate(0, '', true));
        $this->assertFalse($constraint->evaluate('', '', true));
        $this->assertEquals('is not of type "string"', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate('');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that '' is not of type "string".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintIsNotType2()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::isType('string')
        );

        try {
            $constraint->evaluate('', 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(<<<EOF
custom message
Failed asserting that '' is not of type "string".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintIsNull()
    {
        $constraint = PHPUnit_Framework_Assert::isNull();

        $this->assertFalse($constraint->evaluate(0, '', true));
        $this->assertTrue($constraint->evaluate(null, '', true));
        $this->assertEquals('is null', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate(0);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(<<<EOF
Failed asserting that 0 is null.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintIsNull2()
    {
        $constraint = PHPUnit_Framework_Assert::isNull();

        try {
            $constraint->evaluate(0, 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(<<<EOF
custom message
Failed asserting that 0 is null.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintIsNotNull()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::isNull()
        );

        $this->assertFalse($constraint->evaluate(null, '', true));
        $this->assertTrue($constraint->evaluate(0, '', true));
        $this->assertEquals('is not null', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate(null);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(<<<EOF
Failed asserting that null is not null.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintIsNotNull2()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::isNull()
        );

        try {
            $constraint->evaluate(null, 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(<<<EOF
custom message
Failed asserting that null is not null.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintLessThan()
    {
        $constraint = PHPUnit_Framework_Assert::lessThan(1);

        $this->assertTrue($constraint->evaluate(0, '', true));
        $this->assertFalse($constraint->evaluate(1, '', true));
        $this->assertEquals('is less than 1', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate(1);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that 1 is less than 1.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintLessThan2()
    {
        $constraint = PHPUnit_Framework_Assert::lessThan(1);

        try {
            $constraint->evaluate(1, 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
custom message
Failed asserting that 1 is less than 1.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintNotLessThan()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::lessThan(1)
        );

        $this->assertTrue($constraint->evaluate(1, '', true));
        $this->assertFalse($constraint->evaluate(0, '', true));
        $this->assertEquals('is not less than 1', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate(0);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that 0 is not less than 1.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintNotLessThan2()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::lessThan(1)
        );

        try {
            $constraint->evaluate(0, 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
custom message
Failed asserting that 0 is not less than 1.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintLessThanOrEqual()
    {
        $constraint = PHPUnit_Framework_Assert::lessThanOrEqual(1);

        $this->assertTrue($constraint->evaluate(1, '', true));
        $this->assertFalse($constraint->evaluate(2, '', true));
        $this->assertEquals('is equal to 1 or is less than 1', $constraint->toString());
        $this->assertCount(2, $constraint);

        try {
            $constraint->evaluate(2);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that 2 is equal to 1 or is less than 1.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintCallback()
    {
        $closureReflect = function ($parameter) {
            return $parameter;
        };

        $closureWithoutParameter = function () {
            return true;
        };

        $constraint = PHPUnit_Framework_Assert::callback($closureWithoutParameter);
        $this->assertTrue($constraint->evaluate('', '', true));

        $constraint = PHPUnit_Framework_Assert::callback($closureReflect);
        $this->assertTrue($constraint->evaluate(true, '', true));
        $this->assertFalse($constraint->evaluate(false, '', true));

        $callback   = [$this, 'callbackReturningTrue'];
        $constraint = PHPUnit_Framework_Assert::callback($callback);
        $this->assertTrue($constraint->evaluate(false, '', true));

        $callback   = ['Framework_ConstraintTest', 'staticCallbackReturningTrue'];
        $constraint = PHPUnit_Framework_Assert::callback($callback);
        $this->assertTrue($constraint->evaluate(null, '', true));

        $this->assertEquals('is accepted by specified callback', $constraint->toString());
    }

    /**
     * @expectedException PHPUnit_Framework_ExpectationFailedException
     * @expectedExceptionMessage Failed asserting that 'This fails' is accepted by specified callback.
     */
    public function testConstraintCallbackFailure()
    {
        $constraint = PHPUnit_Framework_Assert::callback(function () {
            return false;
        });
        $constraint->evaluate('This fails');
    }

    public function callbackReturningTrue()
    {
        return true;
    }

    public static function staticCallbackReturningTrue()
    {
        return true;
    }

    public function testConstraintLessThanOrEqual2()
    {
        $constraint = PHPUnit_Framework_Assert::lessThanOrEqual(1);

        try {
            $constraint->evaluate(2, 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
custom message
Failed asserting that 2 is equal to 1 or is less than 1.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintNotLessThanOrEqual()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::lessThanOrEqual(1)
        );

        $this->assertTrue($constraint->evaluate(2, '', true));
        $this->assertFalse($constraint->evaluate(1, '', true));
        $this->assertEquals('not( is equal to 1 or is less than 1 )', $constraint->toString());
        $this->assertCount(2, $constraint);

        try {
            $constraint->evaluate(1);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that not( 1 is equal to 1 or is less than 1 ).

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintNotLessThanOrEqual2()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::lessThanOrEqual(1)
        );

        try {
            $constraint->evaluate(1, 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
custom message
Failed asserting that not( 1 is equal to 1 or is less than 1 ).

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintClassHasAttribute()
    {
        $constraint = PHPUnit_Framework_Assert::classHasAttribute('privateAttribute');

        $this->assertTrue($constraint->evaluate('ClassWithNonPublicAttributes', '', true));
        $this->assertFalse($constraint->evaluate('stdClass', '', true));
        $this->assertEquals('has attribute "privateAttribute"', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate('stdClass');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that class "stdClass" has attribute "privateAttribute".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintClassHasAttribute2()
    {
        $constraint = PHPUnit_Framework_Assert::classHasAttribute('privateAttribute');

        try {
            $constraint->evaluate('stdClass', 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(<<<EOF
custom message
Failed asserting that class "stdClass" has attribute "privateAttribute".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintClassNotHasAttribute()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::classHasAttribute('privateAttribute')
        );

        $this->assertTrue($constraint->evaluate('stdClass', '', true));
        $this->assertFalse($constraint->evaluate('ClassWithNonPublicAttributes', '', true));
        $this->assertEquals('does not have attribute "privateAttribute"', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate('ClassWithNonPublicAttributes');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that class "ClassWithNonPublicAttributes" does not have attribute "privateAttribute".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintClassNotHasAttribute2()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::classHasAttribute('privateAttribute')
        );

        try {
            $constraint->evaluate('ClassWithNonPublicAttributes', 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(<<<EOF
custom message
Failed asserting that class "ClassWithNonPublicAttributes" does not have attribute "privateAttribute".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintClassHasStaticAttribute()
    {
        $constraint = PHPUnit_Framework_Assert::classHasStaticAttribute('privateStaticAttribute');

        $this->assertTrue($constraint->evaluate('ClassWithNonPublicAttributes', '', true));
        $this->assertFalse($constraint->evaluate('stdClass', '', true));
        $this->assertEquals('has static attribute "privateStaticAttribute"', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate('stdClass');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that class "stdClass" has static attribute "privateStaticAttribute".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintClassHasStaticAttribute2()
    {
        $constraint = PHPUnit_Framework_Assert::classHasStaticAttribute('foo');

        try {
            $constraint->evaluate('stdClass', 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(<<<EOF
custom message
Failed asserting that class "stdClass" has static attribute "foo".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintClassNotHasStaticAttribute()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::classHasStaticAttribute('privateStaticAttribute')
        );

        $this->assertTrue($constraint->evaluate('stdClass', '', true));
        $this->assertFalse($constraint->evaluate('ClassWithNonPublicAttributes', '', true));
        $this->assertEquals('does not have static attribute "privateStaticAttribute"', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate('ClassWithNonPublicAttributes');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that class "ClassWithNonPublicAttributes" does not have static attribute "privateStaticAttribute".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintClassNotHasStaticAttribute2()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::classHasStaticAttribute('privateStaticAttribute')
        );

        try {
            $constraint->evaluate('ClassWithNonPublicAttributes', 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(<<<EOF
custom message
Failed asserting that class "ClassWithNonPublicAttributes" does not have static attribute "privateStaticAttribute".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintObjectHasAttribute()
    {
        $constraint = PHPUnit_Framework_Assert::objectHasAttribute('privateAttribute');

        $this->assertTrue($constraint->evaluate(new ClassWithNonPublicAttributes, '', true));
        $this->assertFalse($constraint->evaluate(new stdClass, '', true));
        $this->assertEquals('has attribute "privateAttribute"', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate(new stdClass);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that object of class "stdClass" has attribute "privateAttribute".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintObjectHasAttribute2()
    {
        $constraint = PHPUnit_Framework_Assert::objectHasAttribute('privateAttribute');

        try {
            $constraint->evaluate(new stdClass, 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(<<<EOF
custom message
Failed asserting that object of class "stdClass" has attribute "privateAttribute".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintObjectNotHasAttribute()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::objectHasAttribute('privateAttribute')
        );

        $this->assertTrue($constraint->evaluate(new stdClass, '', true));
        $this->assertFalse($constraint->evaluate(new ClassWithNonPublicAttributes, '', true));
        $this->assertEquals('does not have attribute "privateAttribute"', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate(new ClassWithNonPublicAttributes);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that object of class "ClassWithNonPublicAttributes" does not have attribute "privateAttribute".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintObjectNotHasAttribute2()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::objectHasAttribute('privateAttribute')
        );

        try {
            $constraint->evaluate(new ClassWithNonPublicAttributes, 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(<<<EOF
custom message
Failed asserting that object of class "ClassWithNonPublicAttributes" does not have attribute "privateAttribute".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintPCREMatch()
    {
        $constraint = PHPUnit_Framework_Assert::matchesRegularExpression('/foo/');

        $this->assertFalse($constraint->evaluate('barbazbar', '', true));
        $this->assertTrue($constraint->evaluate('barfoobar', '', true));
        $this->assertEquals('matches PCRE pattern "/foo/"', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate('barbazbar');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that 'barbazbar' matches PCRE pattern "/foo/".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintPCREMatch2()
    {
        $constraint = PHPUnit_Framework_Assert::matchesRegularExpression('/foo/');

        try {
            $constraint->evaluate('barbazbar', 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(<<<EOF
custom message
Failed asserting that 'barbazbar' matches PCRE pattern "/foo/".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintPCRENotMatch()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::matchesRegularExpression('/foo/')
        );

        $this->assertTrue($constraint->evaluate('barbazbar', '', true));
        $this->assertFalse($constraint->evaluate('barfoobar', '', true));
        $this->assertEquals('does not match PCRE pattern "/foo/"', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate('barfoobar');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that 'barfoobar' does not match PCRE pattern "/foo/".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintPCRENotMatch2()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::matchesRegularExpression('/foo/')
        );

        try {
            $constraint->evaluate('barfoobar', 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(<<<EOF
custom message
Failed asserting that 'barfoobar' does not match PCRE pattern "/foo/".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintStringMatches()
    {
        $constraint = PHPUnit_Framework_Assert::matches('*%c*');
        $this->assertFalse($constraint->evaluate('**', '', true));
        $this->assertTrue($constraint->evaluate('***', '', true));
        $this->assertEquals('matches PCRE pattern "/^\*.\*$/s"', $constraint->toString());
        $this->assertCount(1, $constraint);
    }

    public function testConstraintStringMatches2()
    {
        $constraint = PHPUnit_Framework_Assert::matches('*%s*');
        $this->assertFalse($constraint->evaluate('**', '', true));
        $this->assertTrue($constraint->evaluate('***', '', true));
        $this->assertEquals('matches PCRE pattern "/^\*[^\r\n]+\*$/s"', $constraint->toString());
        $this->assertCount(1, $constraint);
    }

    public function testConstraintStringMatches3()
    {
        $constraint = PHPUnit_Framework_Assert::matches('*%i*');
        $this->assertFalse($constraint->evaluate('**', '', true));
        $this->assertTrue($constraint->evaluate('*0*', '', true));
        $this->assertEquals('matches PCRE pattern "/^\*[+-]?\d+\*$/s"', $constraint->toString());
        $this->assertCount(1, $constraint);
    }

    public function testConstraintStringMatches4()
    {
        $constraint = PHPUnit_Framework_Assert::matches('*%d*');
        $this->assertFalse($constraint->evaluate('**', '', true));
        $this->assertTrue($constraint->evaluate('*0*', '', true));
        $this->assertEquals('matches PCRE pattern "/^\*\d+\*$/s"', $constraint->toString());
        $this->assertCount(1, $constraint);
    }

    public function testConstraintStringMatches5()
    {
        $constraint = PHPUnit_Framework_Assert::matches('*%x*');
        $this->assertFalse($constraint->evaluate('**', '', true));
        $this->assertTrue($constraint->evaluate('*0f0f0f*', '', true));
        $this->assertEquals('matches PCRE pattern "/^\*[0-9a-fA-F]+\*$/s"', $constraint->toString());
        $this->assertCount(1, $constraint);
    }

    public function testConstraintStringMatches6()
    {
        $constraint = PHPUnit_Framework_Assert::matches('*%f*');
        $this->assertFalse($constraint->evaluate('**', '', true));
        $this->assertTrue($constraint->evaluate('*1.0*', '', true));
        $this->assertEquals('matches PCRE pattern "/^\*[+-]?\.?\d+\.?\d*(?:[Ee][+-]?\d+)?\*$/s"', $constraint->toString());
        $this->assertCount(1, $constraint);
    }

    public function testConstraintStringStartsWith()
    {
        $constraint = PHPUnit_Framework_Assert::stringStartsWith('prefix');

        $this->assertFalse($constraint->evaluate('foo', '', true));
        $this->assertTrue($constraint->evaluate('prefixfoo', '', true));
        $this->assertEquals('starts with "prefix"', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate('foo');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that 'foo' starts with "prefix".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintStringStartsWith2()
    {
        $constraint = PHPUnit_Framework_Assert::stringStartsWith('prefix');

        try {
            $constraint->evaluate('foo', 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
custom message\nFailed asserting that 'foo' starts with "prefix".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintStringStartsNotWith()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::stringStartsWith('prefix')
        );

        $this->assertTrue($constraint->evaluate('foo', '', true));
        $this->assertFalse($constraint->evaluate('prefixfoo', '', true));
        $this->assertEquals('starts not with "prefix"', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate('prefixfoo');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that 'prefixfoo' starts not with "prefix".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintStringStartsNotWith2()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::stringStartsWith('prefix')
        );

        try {
            $constraint->evaluate('prefixfoo', 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
custom message
Failed asserting that 'prefixfoo' starts not with "prefix".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintStringContains()
    {
        $constraint = PHPUnit_Framework_Assert::stringContains('foo');

        $this->assertFalse($constraint->evaluate('barbazbar', '', true));
        $this->assertTrue($constraint->evaluate('barfoobar', '', true));
        $this->assertEquals('contains "foo"', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate('barbazbar');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that 'barbazbar' contains "foo".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintStringContainsWhenIgnoreCase()
    {
        $constraint = PHPUnit_Framework_Assert::stringContains('oryginał', true);

        $this->assertFalse($constraint->evaluate('oryginal', '', true));
        $this->assertTrue($constraint->evaluate('ORYGINAŁ', '', true));
        $this->assertTrue($constraint->evaluate('oryginał', '', true));
        $this->assertEquals('contains "oryginał"', $constraint->toString());
        $this->assertEquals(1, count($constraint));

        try {
            $constraint->evaluate('oryginal');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
                <<<EOF
Failed asserting that 'oryginal' contains "oryginał".

EOF
                ,
                PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintStringContainsForUtf8StringWhenNotIgnoreCase()
    {
        $constraint = PHPUnit_Framework_Assert::stringContains('oryginał', false);

        $this->assertFalse($constraint->evaluate('oryginal', '', true));
        $this->assertFalse($constraint->evaluate('ORYGINAŁ', '', true));
        $this->assertTrue($constraint->evaluate('oryginał', '', true));
        $this->assertEquals('contains "oryginał"', $constraint->toString());
        $this->assertEquals(1, count($constraint));

        try {
            $constraint->evaluate('oryginal');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
                <<<EOF
Failed asserting that 'oryginal' contains "oryginał".

EOF
                ,
                PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintStringContains2()
    {
        $constraint = PHPUnit_Framework_Assert::stringContains('foo');

        try {
            $constraint->evaluate('barbazbar', 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
custom message
Failed asserting that 'barbazbar' contains "foo".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintStringNotContains()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::stringContains('foo')
        );

        $this->assertTrue($constraint->evaluate('barbazbar', '', true));
        $this->assertFalse($constraint->evaluate('barfoobar', '', true));
        $this->assertEquals('does not contain "foo"', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate('barfoobar');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that 'barfoobar' does not contain "foo".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintStringNotContainsWhenIgnoreCase()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
            PHPUnit_Framework_Assert::stringContains('oryginał')
        );

        $this->assertTrue($constraint->evaluate('original', '', true));
        $this->assertFalse($constraint->evaluate('ORYGINAŁ', '', true));
        $this->assertFalse($constraint->evaluate('oryginał', '', true));
        $this->assertEquals('does not contain "oryginał"', $constraint->toString());
        $this->assertEquals(1, count($constraint));

        try {
            $constraint->evaluate('ORYGINAŁ');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
                <<<EOF
Failed asserting that 'ORYGINAŁ' does not contain "oryginał".

EOF
                ,
                PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintStringNotContainsForUtf8StringWhenNotIgnoreCase()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
            PHPUnit_Framework_Assert::stringContains('oryginał', false)
        );

        $this->assertTrue($constraint->evaluate('original', '', true));
        $this->assertTrue($constraint->evaluate('ORYGINAŁ', '', true));
        $this->assertFalse($constraint->evaluate('oryginał', '', true));
        $this->assertEquals('does not contain "oryginał"', $constraint->toString());
        $this->assertEquals(1, count($constraint));

        try {
            $constraint->evaluate('oryginał');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
                <<<EOF
Failed asserting that 'oryginał' does not contain "oryginał".

EOF
                ,
                PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintStringNotContains2()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::stringContains('foo')
        );

        try {
            $constraint->evaluate('barfoobar', 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
custom message
Failed asserting that 'barfoobar' does not contain "foo".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintStringEndsWith()
    {
        $constraint = PHPUnit_Framework_Assert::stringEndsWith('suffix');

        $this->assertFalse($constraint->evaluate('foo', '', true));
        $this->assertTrue($constraint->evaluate('foosuffix', '', true));
        $this->assertEquals('ends with "suffix"', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate('foo');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that 'foo' ends with "suffix".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintStringEndsWith2()
    {
        $constraint = PHPUnit_Framework_Assert::stringEndsWith('suffix');

        try {
            $constraint->evaluate('foo', 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
custom message
Failed asserting that 'foo' ends with "suffix".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintStringEndsNotWith()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::stringEndsWith('suffix')
        );

        $this->assertTrue($constraint->evaluate('foo', '', true));
        $this->assertFalse($constraint->evaluate('foosuffix', '', true));
        $this->assertEquals('ends not with "suffix"', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate('foosuffix');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that 'foosuffix' ends not with "suffix".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintStringEndsNotWith2()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::stringEndsWith('suffix')
        );

        try {
            $constraint->evaluate('foosuffix', 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
custom message
Failed asserting that 'foosuffix' ends not with "suffix".

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintArrayContainsCheckForObjectIdentity()
    {
        // Check for primitive type.
        $constraint = new PHPUnit_Framework_Constraint_TraversableContains('foo', true, true);

        $this->assertFalse($constraint->evaluate([0], '', true));
        $this->assertFalse($constraint->evaluate([true], '', true));

        // Default case.
        $constraint = new PHPUnit_Framework_Constraint_TraversableContains('foo');

        $this->assertTrue($constraint->evaluate([0], '', true));
        $this->assertTrue($constraint->evaluate([true], '', true));
    }

    public function testConstraintArrayContains()
    {
        $constraint = new PHPUnit_Framework_Constraint_TraversableContains('foo');

        $this->assertFalse($constraint->evaluate(['bar'], '', true));
        $this->assertTrue($constraint->evaluate(['foo'], '', true));
        $this->assertEquals("contains 'foo'", $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate(['bar']);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that an array contains 'foo'.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintArrayContains2()
    {
        $constraint = new PHPUnit_Framework_Constraint_TraversableContains('foo');

        try {
            $constraint->evaluate(['bar'], 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
custom message
Failed asserting that an array contains 'foo'.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintArrayNotContains()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          new PHPUnit_Framework_Constraint_TraversableContains('foo')
        );

        $this->assertTrue($constraint->evaluate(['bar'], '', true));
        $this->assertFalse($constraint->evaluate(['foo'], '', true));
        $this->assertEquals("does not contain 'foo'", $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate(['foo']);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that an array does not contain 'foo'.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintArrayNotContains2()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          new PHPUnit_Framework_Constraint_TraversableContains('foo')
        );

        try {
            $constraint->evaluate(['foo'], 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
custom message
Failed asserting that an array does not contain 'foo'.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintSplObjectStorageContains()
    {
        $object     = new StdClass;
        $constraint = new PHPUnit_Framework_Constraint_TraversableContains($object);
        $this->assertStringMatchesFormat('contains stdClass Object &%s ()', $constraint->toString());

        $storage = new SplObjectStorage;
        $this->assertFalse($constraint->evaluate($storage, '', true));

        $storage->attach($object);
        $this->assertTrue($constraint->evaluate($storage, '', true));

        try {
            $constraint->evaluate(new SplObjectStorage);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertStringMatchesFormat(
              <<<EOF
Failed asserting that a traversable contains stdClass Object &%x ().

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintSplObjectStorageContains2()
    {
        $object     = new StdClass;
        $constraint = new PHPUnit_Framework_Constraint_TraversableContains($object);

        try {
            $constraint->evaluate(new SplObjectStorage, 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertStringMatchesFormat(
              <<<EOF
custom message
Failed asserting that a traversable contains stdClass Object &%x ().

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testAttributeEqualTo()
    {
        $object     = new ClassWithNonPublicAttributes;
        $constraint = PHPUnit_Framework_Assert::attributeEqualTo('foo', 1);

        $this->assertTrue($constraint->evaluate($object, '', true));
        $this->assertEquals('attribute "foo" is equal to 1', $constraint->toString());
        $this->assertCount(1, $constraint);

        $constraint = PHPUnit_Framework_Assert::attributeEqualTo('foo', 2);

        $this->assertFalse($constraint->evaluate($object, '', true));

        try {
            $constraint->evaluate($object);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that attribute "foo" is equal to 2.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testAttributeEqualTo2()
    {
        $object     = new ClassWithNonPublicAttributes;
        $constraint = PHPUnit_Framework_Assert::attributeEqualTo('foo', 2);

        try {
            $constraint->evaluate($object, 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
custom message\nFailed asserting that attribute "foo" is equal to 2.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testAttributeNotEqualTo()
    {
        $object     = new ClassWithNonPublicAttributes;
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::attributeEqualTo('foo', 2)
        );

        $this->assertTrue($constraint->evaluate($object, '', true));
        $this->assertEquals('attribute "foo" is not equal to 2', $constraint->toString());
        $this->assertCount(1, $constraint);

        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::attributeEqualTo('foo', 1)
        );

        $this->assertFalse($constraint->evaluate($object, '', true));

        try {
            $constraint->evaluate($object);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that attribute "foo" is not equal to 1.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testAttributeNotEqualTo2()
    {
        $object     = new ClassWithNonPublicAttributes;
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          PHPUnit_Framework_Assert::attributeEqualTo('foo', 1)
        );

        try {
            $constraint->evaluate($object, 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
custom message\nFailed asserting that attribute "foo" is not equal to 1.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintIsEmpty()
    {
        $constraint = new PHPUnit_Framework_Constraint_IsEmpty;

        $this->assertFalse($constraint->evaluate(['foo'], '', true));
        $this->assertTrue($constraint->evaluate([], '', true));
        $this->assertFalse($constraint->evaluate(new ArrayObject(['foo']), '', true));
        $this->assertTrue($constraint->evaluate(new ArrayObject([]), '', true));
        $this->assertEquals('is empty', $constraint->toString());
        $this->assertCount(1, $constraint);

        try {
            $constraint->evaluate(['foo']);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that an array is empty.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintIsEmpty2()
    {
        $constraint = new PHPUnit_Framework_Constraint_IsEmpty;

        try {
            $constraint->evaluate(['foo'], 'custom message');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
custom message\nFailed asserting that an array is empty.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintCountWithAnArray()
    {
        $constraint = new PHPUnit_Framework_Constraint_Count(5);

        $this->assertTrue($constraint->evaluate([1, 2, 3, 4, 5], '', true));
        $this->assertFalse($constraint->evaluate([1, 2, 3, 4], '', true));
    }

    public function testConstraintCountWithAnIteratorWhichDoesNotImplementCountable()
    {
        $constraint = new PHPUnit_Framework_Constraint_Count(5);

        $this->assertTrue($constraint->evaluate(new TestIterator([1, 2, 3, 4, 5]), '', true));
        $this->assertFalse($constraint->evaluate(new TestIterator([1, 2, 3, 4]), '', true));
    }

    public function testConstraintCountWithAnObjectImplementingCountable()
    {
        $constraint = new PHPUnit_Framework_Constraint_Count(5);

        $this->assertTrue($constraint->evaluate(new ArrayObject([1, 2, 3, 4, 5]), '', true));
        $this->assertFalse($constraint->evaluate(new ArrayObject([1, 2, 3, 4]), '', true));
    }

    public function testConstraintCountFailing()
    {
        $constraint = new PHPUnit_Framework_Constraint_Count(5);

        try {
            $constraint->evaluate([1, 2]);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that actual size 2 matches expected size 5.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintNotCountFailing()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          new PHPUnit_Framework_Constraint_Count(2)
        );

        try {
            $constraint->evaluate([1, 2]);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that actual size 2 does not match expected size 2.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintSameSizeWithAnArray()
    {
        $constraint = new PHPUnit_Framework_Constraint_SameSize([1, 2, 3, 4, 5]);

        $this->assertTrue($constraint->evaluate([6, 7, 8, 9, 10], '', true));
        $this->assertFalse($constraint->evaluate([1, 2, 3, 4], '', true));
    }

    public function testConstraintSameSizeWithAnIteratorWhichDoesNotImplementCountable()
    {
        $constraint = new PHPUnit_Framework_Constraint_SameSize(new TestIterator([1, 2, 3, 4, 5]));

        $this->assertTrue($constraint->evaluate(new TestIterator([6, 7, 8, 9, 10]), '', true));
        $this->assertFalse($constraint->evaluate(new TestIterator([1, 2, 3, 4]), '', true));
    }

    public function testConstraintSameSizeWithAnObjectImplementingCountable()
    {
        $constraint = new PHPUnit_Framework_Constraint_SameSize(new ArrayObject([1, 2, 3, 4, 5]));

        $this->assertTrue($constraint->evaluate(new ArrayObject([6, 7, 8, 9, 10]), '', true));
        $this->assertFalse($constraint->evaluate(new ArrayObject([1, 2, 3, 4]), '', true));
    }

    public function testConstraintSameSizeFailing()
    {
        $constraint = new PHPUnit_Framework_Constraint_SameSize([1, 2, 3, 4, 5]);

        try {
            $constraint->evaluate([1, 2]);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that actual size 2 matches expected size 5.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintNotSameSizeFailing()
    {
        $constraint = PHPUnit_Framework_Assert::logicalNot(
          new PHPUnit_Framework_Constraint_SameSize([1, 2])
        );

        try {
            $constraint->evaluate([3, 4]);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that actual size 2 does not match expected size 2.

EOF
              ,
              PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    public function testConstraintException()
    {
        $constraint = new PHPUnit_Framework_Constraint_Exception('FoobarException');
        $exception  = new DummyException('Test');
        $stackTrace = PHPUnit_Util_Filter::getFilteredStacktrace($exception);

        try {
            $constraint->evaluate($exception);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertEquals(
              <<<EOF
Failed asserting that exception of type "DummyException" matches expected exception "FoobarException". Message was: "Test" at
$stackTrace.

EOF
                ,
                PHPUnit_Framework_TestFailure::exceptionToString($e)
            );

            return;
        }

        $this->fail();
    }

    /**
     * Removes spaces in front of newlines
     *
     * @param string $string
     *
     * @return string
     */
    private function trimnl($string)
    {
        return preg_replace('/[ ]*\n/', "\n", $string);
    }
}
