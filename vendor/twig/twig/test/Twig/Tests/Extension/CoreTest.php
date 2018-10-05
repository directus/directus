<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Twig_Tests_Extension_CoreTest extends \PHPUnit\Framework\TestCase
{
    /**
     * @dataProvider getRandomFunctionTestData
     */
    public function testRandomFunction($value, $expectedInArray)
    {
        $env = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock());

        for ($i = 0; $i < 100; ++$i) {
            $this->assertTrue(in_array(twig_random($env, $value), $expectedInArray, true)); // assertContains() would not consider the type
        }
    }

    public function getRandomFunctionTestData()
    {
        return array(
            array(// array
                array('apple', 'orange', 'citrus'),
                array('apple', 'orange', 'citrus'),
            ),
            array(// Traversable
                new ArrayObject(array('apple', 'orange', 'citrus')),
                array('apple', 'orange', 'citrus'),
            ),
            array(// unicode string
                'Ä€é',
                array('Ä', '€', 'é'),
            ),
            array(// numeric but string
                '123',
                array('1', '2', '3'),
            ),
            array(// integer
                5,
                range(0, 5, 1),
            ),
            array(// float
                5.9,
                range(0, 5, 1),
            ),
            array(// negative
                -2,
                array(0, -1, -2),
            ),
        );
    }

    public function testRandomFunctionWithoutParameter()
    {
        $max = mt_getrandmax();

        for ($i = 0; $i < 100; ++$i) {
            $val = twig_random(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()));
            $this->assertTrue(is_int($val) && $val >= 0 && $val <= $max);
        }
    }

    public function testRandomFunctionReturnsAsIs()
    {
        $this->assertSame('', twig_random(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()), ''));
        $this->assertSame('', twig_random(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock(), array('charset' => null)), ''));

        $instance = new stdClass();
        $this->assertSame($instance, twig_random(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()), $instance));
    }

    /**
     * @expectedException Twig_Error_Runtime
     */
    public function testRandomFunctionOfEmptyArrayThrowsException()
    {
        twig_random(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()), array());
    }

    public function testRandomFunctionOnNonUTF8String()
    {
        $twig = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock());
        $twig->setCharset('ISO-8859-1');

        $text = iconv('UTF-8', 'ISO-8859-1', 'Äé');
        for ($i = 0; $i < 30; ++$i) {
            $rand = twig_random($twig, $text);
            $this->assertTrue(in_array(iconv('ISO-8859-1', 'UTF-8', $rand), array('Ä', 'é'), true));
        }
    }

    public function testReverseFilterOnNonUTF8String()
    {
        $twig = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock());
        $twig->setCharset('ISO-8859-1');

        $input = iconv('UTF-8', 'ISO-8859-1', 'Äé');
        $output = iconv('ISO-8859-1', 'UTF-8', twig_reverse_filter($twig, $input));

        $this->assertEquals($output, 'éÄ');
    }

    /**
     * @dataProvider provideCustomEscaperCases
     */
    public function testCustomEscaper($expected, $string, $strategy)
    {
        $twig = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock());
        $twig->getExtension('Twig_Extension_Core')->setEscaper('foo', 'foo_escaper_for_test');

        $this->assertSame($expected, twig_escape_filter($twig, $string, $strategy));
    }

    public function provideCustomEscaperCases()
    {
        return array(
            array('fooUTF-8', 'foo', 'foo'),
            array('UTF-8', null, 'foo'),
            array('42UTF-8', 42, 'foo'),
        );
    }

    /**
     * @expectedException Twig_Error_Runtime
     */
    public function testUnknownCustomEscaper()
    {
        twig_escape_filter(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()), 'foo', 'bar');
    }

    /**
     * @dataProvider provideTwigFirstCases
     */
    public function testTwigFirst($expected, $input)
    {
        $twig = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock());
        $this->assertSame($expected, twig_first($twig, $input));
    }

    public function provideTwigFirstCases()
    {
        $i = array(1 => 'a', 2 => 'b', 3 => 'c');

        return array(
            array('a', 'abc'),
            array(1, array(1, 2, 3)),
            array('', null),
            array('', ''),
            array('a', new CoreTestIterator($i, array_keys($i), true, 3)),
        );
    }

    /**
     * @dataProvider provideTwigLastCases
     */
    public function testTwigLast($expected, $input)
    {
        $twig = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock());
        $this->assertSame($expected, twig_last($twig, $input));
    }

    public function provideTwigLastCases()
    {
        $i = array(1 => 'a', 2 => 'b', 3 => 'c');

        return array(
            array('c', 'abc'),
            array(3, array(1, 2, 3)),
            array('', null),
            array('', ''),
            array('c', new CoreTestIterator($i, array_keys($i), true)),
        );
    }

    /**
     * @dataProvider provideArrayKeyCases
     */
    public function testArrayKeysFilter(array $expected, $input)
    {
        $this->assertSame($expected, twig_get_array_keys_filter($input));
    }

    public function provideArrayKeyCases()
    {
        $array = array('a' => 'a1', 'b' => 'b1', 'c' => 'c1');
        $keys = array_keys($array);

        return array(
            array($keys, $array),
            array($keys, new CoreTestIterator($array, $keys)),
            array($keys, new CoreTestIteratorAggregate($array, $keys)),
            array($keys, new CoreTestIteratorAggregateAggregate($array, $keys)),
            array(array(), null),
            array(array('a'), new SimpleXMLElement('<xml><a></a></xml>')),
        );
    }

    /**
     * @dataProvider provideInFilterCases
     */
    public function testInFilter($expected, $value, $compare)
    {
        $this->assertSame($expected, twig_in_filter($value, $compare));
    }

    public function provideInFilterCases()
    {
        $array = array(1, 2, 'a' => 3, 5, 6, 7);
        $keys = array_keys($array);

        return array(
            array(true, 1, $array),
            array(true, '3', $array),
            array(true, '3', 'abc3def'),
            array(true, 1, new CoreTestIterator($array, $keys, true, 1)),
            array(true, '3', new CoreTestIterator($array, $keys, true, 3)),
            array(true, '3', new CoreTestIteratorAggregateAggregate($array, $keys, true, 3)),
            array(false, 4, $array),
            array(false, 4, new CoreTestIterator($array, $keys, true)),
            array(false, 4, new CoreTestIteratorAggregateAggregate($array, $keys, true)),
            array(false, 1, 1),
            array(true, 'b', new SimpleXMLElement('<xml><a>b</a></xml>')),
        );
    }

    /**
     * @dataProvider provideSliceFilterCases
     */
    public function testSliceFilter($expected, $input, $start, $length = null, $preserveKeys = false)
    {
        $twig = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock());
        $this->assertSame($expected, twig_slice($twig, $input, $start, $length, $preserveKeys));
    }

    public function provideSliceFilterCases()
    {
        $i = array('a' => 1, 'b' => 2, 'c' => 3, 'd' => 4);
        $keys = array_keys($i);

        return array(
            array(array('a' => 1), $i, 0, 1, true),
            array(array('a' => 1), $i, 0, 1, false),
            array(array('b' => 2, 'c' => 3), $i, 1, 2),
            array(array(1), array(1, 2, 3, 4), 0, 1),
            array(array(2, 3), array(1, 2, 3, 4), 1, 2),
            array(array(2, 3), new CoreTestIterator($i, $keys, true), 1, 2),
            array(array('c' => 3, 'd' => 4), new CoreTestIteratorAggregate($i, $keys, true), 2, null, true),
            array($i, new CoreTestIterator($i, $keys, true), 0, count($keys) + 10, true),
            array(array(), new CoreTestIterator($i, $keys, true), count($keys) + 10),
            array('de', 'abcdef', 3, 2),
            array(array(), new SimpleXMLElement('<items><item>1</item><item>2</item></items>'), 3),
            array(array(), new ArrayIterator(array(1, 2)), 3),
        );
    }
}

function foo_escaper_for_test(Twig_Environment $env, $string, $charset)
{
    return $string.$charset;
}

final class CoreTestIteratorAggregate implements IteratorAggregate
{
    private $iterator;

    public function __construct(array $array, array $keys, $allowAccess = false, $maxPosition = false)
    {
        $this->iterator = new CoreTestIterator($array, $keys, $allowAccess, $maxPosition);
    }

    public function getIterator()
    {
        return $this->iterator;
    }
}

final class CoreTestIteratorAggregateAggregate implements IteratorAggregate
{
    private $iterator;

    public function __construct(array $array, array $keys, $allowValueAccess = false, $maxPosition = false)
    {
        $this->iterator = new CoreTestIteratorAggregate($array, $keys, $allowValueAccess, $maxPosition);
    }

    public function getIterator()
    {
        return $this->iterator;
    }
}

final class CoreTestIterator implements Iterator
{
    private $position;
    private $array;
    private $arrayKeys;
    private $allowValueAccess;
    private $maxPosition;

    public function __construct(array $values, array $keys, $allowValueAccess = false, $maxPosition = false)
    {
        $this->array = $values;
        $this->arrayKeys = $keys;
        $this->position = 0;
        $this->allowValueAccess = $allowValueAccess;
        $this->maxPosition = false === $maxPosition ? count($values) + 1 : $maxPosition;
    }

    public function rewind()
    {
        $this->position = 0;
    }

    public function current()
    {
        if ($this->allowValueAccess) {
            return $this->array[$this->key()];
        }

        throw new LogicException('Code should only use the keys, not the values provided by iterator.');
    }

    public function key()
    {
        return $this->arrayKeys[$this->position];
    }

    public function next()
    {
        ++$this->position;
        if ($this->position === $this->maxPosition) {
            throw new LogicException(sprintf('Code should not iterate beyond %d.', $this->maxPosition));
        }
    }

    public function valid()
    {
        return isset($this->arrayKeys[$this->position]);
    }
}
