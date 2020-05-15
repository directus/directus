<?php
/**
 * Slim Framework (http://slimframework.com)
 *
 * @link      https://github.com/codeguy/Slim
 * @copyright Copyright (c) 2011-2015 Josh Lockhart
 * @license   https://github.com/codeguy/Slim/blob/master/LICENSE (MIT License)
 */
namespace Slim\Tests\Views;

use Slim\Views\Twig;

require dirname(__DIR__) . '/vendor/autoload.php';

class TwigTest extends \PHPUnit_Framework_TestCase
{
    public function testFetch()
    {
        $view = new Twig(dirname(__FILE__) . '/templates');

        $output = $view->fetch('example.html', [
            'name' => 'Josh'
        ]);

        $this->assertEquals("<p>Hi, my name is Josh.</p>\n", $output);
    }

    public function testFetchFromString()
    {
        $view = new Twig(dirname(__FILE__) . '/templates');

        $output = $view->fetchFromString("<p>Hi, my name is {{ name }}.</p>", [
            'name' => 'Josh'
        ]);

        $this->assertEquals("<p>Hi, my name is Josh.</p>", $output);
    }

    public function testFetchBlock()
    {
        $view = new Twig(dirname(__FILE__) . '/templates');

        $outputOne = $view->fetchBlock('block_example.html', 'first', [
            'name' => 'Josh'
        ]);

        $outputTwo = $view->fetchBlock('block_example.html', 'second', [
            'name' => 'Peter'
        ]);

        $this->assertEquals("<p>Hi, my name is Josh.</p>", $outputOne);
        $this->assertEquals("<p>My name is not Peter.</p>", $outputTwo);
    }

    public function testSingleNamespaceAndMultipleDirectories()
    {
        $weekday = (new \DateTimeImmutable('2016-03-08'))->format('l');

        $view = new Twig(
            [
                'namespace' => [
                    __DIR__.'/another',
                    __DIR__.'/templates',
                    __DIR__.'/multi',
                ],
            ]
        );

        $anotherDirectory = $view->fetch('@namespace/example.html', [
            'name' => 'Peter'
        ]);

        $templatesDirectory = $view->fetch('@namespace/another_example.html', [
            'name'   => 'Peter',
            'gender' => 'male',
        ]);

        $outputMulti = $view->fetch('@namespace/directory/template/example.html', [
            'weekday' => $weekday,
        ]);

        $this->assertEquals("<p>Hi, my name is Peter.</p>\n", $anotherDirectory);
        $this->assertEquals("<p>Hi, my name is Peter and I am male.</p>\n", $templatesDirectory);
        $this->assertEquals('Happy Tuesday!', $outputMulti);
    }

    public function testArrayWithASingleTemplateWithANamespace()
    {
        $views = new Twig([
            'One' => [
                __DIR__.'/templates',
            ],
        ]);

        $output = $views->fetch('@One/example.html', [
            'name' => 'Josh'
        ]);

        $this->assertEquals("<p>Hi, my name is Josh.</p>\n", $output);
    }

    public function testASingleTemplateWithANamespace()
    {
        $views = new Twig([
            'One' => __DIR__.'/templates',
        ]);

        $output = $views->fetch('@One/example.html', [
            'name' => 'Josh'
        ]);

        $this->assertEquals("<p>Hi, my name is Josh.</p>\n", $output);
    }

    public function testMultipleTemplatesWithMultipleNamespace()
    {
        $weekday = (new \DateTimeImmutable('2016-03-08'))->format('l');

        $views = new Twig([
            'One'   => __DIR__.'/templates',
            'Two'   => __DIR__.'/another',
            'Three' => [
                __DIR__.'/multi',
            ],
        ]);

        $outputOne = $views->fetch('@One/example.html', [
            'name' => 'Peter'
        ]);

        $outputTwo = $views->fetch('@Two/another_example.html', [
            'name'   => 'Peter',
            'gender' => 'male'
        ]);

        $outputThree = $views->fetch('@Three/directory/template/example.html', [
            'weekday' => $weekday,
        ]);

        $this->assertEquals("<p>Hi, my name is Peter.</p>\n", $outputOne);
        $this->assertEquals("<p>Hi, my name is Peter and I am male.</p>\n", $outputTwo);
        $this->assertEquals('Happy Tuesday!', $outputThree);
    }

    public function testMultipleDirectoriesWithoutNamespaces()
    {
        $weekday = (new \DateTimeImmutable('2016-03-08'))->format('l');
        $view    = new Twig([__DIR__.'/multi/', __DIR__.'/another/']);

        $rootDirectory = $view->fetch('directory/template/example.html', [
            'weekday' => $weekday,
        ]);
        $multiDirectory  = $view->fetch('another_example.html', [
            'name'   => 'Peter',
            'gender' => 'male',
        ]);

        $this->assertEquals('Happy Tuesday!', $rootDirectory);
        $this->assertEquals("<p>Hi, my name is Peter and I am male.</p>\n", $multiDirectory);
    }

    public function testRender()
    {
        $view = new Twig(dirname(__FILE__) . '/templates');

        $mockBody = $this->getMockBuilder('Psr\Http\Message\StreamInterface')
            ->disableOriginalConstructor()
            ->getMock();

        $mockResponse = $this->getMockBuilder('Psr\Http\Message\ResponseInterface')
            ->disableOriginalConstructor()
            ->getMock();

        $mockBody->expects($this->once())
            ->method('write')
            ->with("<p>Hi, my name is Josh.</p>\n")
            ->willReturn(28);

        $mockResponse->expects($this->once())
            ->method('getBody')
            ->willReturn($mockBody);

        $response = $view->render($mockResponse, 'example.html', [
            'name' => 'Josh'
        ]);
        $this->assertInstanceOf('Psr\Http\Message\ResponseInterface', $response);
    }
}
