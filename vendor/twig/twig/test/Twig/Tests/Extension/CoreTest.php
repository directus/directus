<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Twig_Tests_Extension_CoreTest extends PHPUnit_Framework_TestCase
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
        if (!function_exists('iconv') && !function_exists('mb_convert_encoding')) {
            $this->markTestSkipped('needs iconv or mbstring');
        }

        $twig = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock());
        $twig->setCharset('ISO-8859-1');

        $text = twig_convert_encoding('Äé', 'ISO-8859-1', 'UTF-8');
        for ($i = 0; $i < 30; ++$i) {
            $rand = twig_random($twig, $text);
            $this->assertTrue(in_array(twig_convert_encoding($rand, 'UTF-8', 'ISO-8859-1'), array('Ä', 'é'), true));
        }
    }

    public function testReverseFilterOnNonUTF8String()
    {
        if (!function_exists('iconv') && !function_exists('mb_convert_encoding')) {
            $this->markTestSkipped('needs iconv or mbstring');
        }

        $twig = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock());
        $twig->setCharset('ISO-8859-1');

        $input = twig_convert_encoding('Äé', 'ISO-8859-1', 'UTF-8');
        $output = twig_convert_encoding(twig_reverse_filter($twig, $input), 'UTF-8', 'ISO-8859-1');

        $this->assertEquals($output, 'éÄ');
    }

    public function testCustomEscaper()
    {
        $twig = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock());
        $twig->getExtension('core')->setEscaper('foo', 'foo_escaper_for_test');

        $this->assertEquals('fooUTF-8', twig_escape_filter($twig, 'foo', 'foo'));
        $this->assertEquals('UTF-8', twig_escape_filter($twig, null, 'foo'));
        $this->assertEquals('42UTF-8', twig_escape_filter($twig, 42, 'foo'));
    }

    /**
     * @expectedException Twig_Error_Runtime
     */
    public function testUnknownCustomEscaper()
    {
        twig_escape_filter(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()), 'foo', 'bar');
    }

    public function testTwigFirst()
    {
        $twig = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock());
        $this->assertEquals('a', twig_first($twig, 'abc'));
        $this->assertEquals(1, twig_first($twig, array(1, 2, 3)));
        $this->assertSame('', twig_first($twig, null));
        $this->assertSame('', twig_first($twig, ''));
    }

    public function testTwigLast()
    {
        $twig = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock());
        $this->assertEquals('c', twig_last($twig, 'abc'));
        $this->assertEquals(3, twig_last($twig, array(1, 2, 3)));
        $this->assertSame('', twig_last($twig, null));
        $this->assertSame('', twig_last($twig, ''));
    }
}

function foo_escaper_for_test(Twig_Environment $env, $string, $charset)
{
    return $string.$charset;
}
