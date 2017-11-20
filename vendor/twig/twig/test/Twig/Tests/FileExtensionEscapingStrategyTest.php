<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Twig_Tests_FileExtensionEscapingStrategyTest extends \PHPUnit\Framework\TestCase
{
    /**
     * @dataProvider getGuessData
     */
    public function testGuess($strategy, $filename)
    {
        $this->assertSame($strategy, Twig_FileExtensionEscapingStrategy::guess($filename));
    }

    public function getGuessData()
    {
        return array(
            // default
            array('html', 'foo.html'),
            array('html', 'foo.html.twig'),
            array('html', 'foo'),
            array('html', 'foo.bar.twig'),
            array('html', 'foo.txt/foo'),
            array('html', 'foo.txt/foo.js/'),

            // css
            array('css', 'foo.css'),
            array('css', 'foo.css.twig'),
            array('css', 'foo.twig.css'),
            array('css', 'foo.js.css'),
            array('css', 'foo.js.css.twig'),

            // js
            array('js', 'foo.js'),
            array('js', 'foo.js.twig'),
            array('js', 'foo.txt/foo.js'),
            array('js', 'foo.txt.twig/foo.js'),

            // txt
            array(false, 'foo.txt'),
            array(false, 'foo.txt.twig'),
        );
    }
}
