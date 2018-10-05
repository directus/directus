<?php
/*
 * This file is part of the php-code-coverage package.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace SebastianBergmann\CodeCoverage\Report\Xml;

use SebastianBergmann\CodeCoverage\Util;

class Totals
{
    /**
     * @var \DOMNode
     */
    private $container;

    /**
     * @var \DOMElement
     */
    private $linesNode;

    /**
     * @var \DOMElement
     */
    private $methodsNode;

    /**
     * @var \DOMElement
     */
    private $functionsNode;

    /**
     * @var \DOMElement
     */
    private $classesNode;

    /**
     * @var \DOMElement
     */
    private $traitsNode;

    public function __construct(\DOMElement $container)
    {
        $this->container = $container;
        $dom             = $container->ownerDocument;

        $this->linesNode = $dom->createElementNS(
            'http://schema.phpunit.de/coverage/1.0',
            'lines'
        );

        $this->methodsNode = $dom->createElementNS(
            'http://schema.phpunit.de/coverage/1.0',
            'methods'
        );

        $this->functionsNode = $dom->createElementNS(
            'http://schema.phpunit.de/coverage/1.0',
            'functions'
        );

        $this->classesNode = $dom->createElementNS(
            'http://schema.phpunit.de/coverage/1.0',
            'classes'
        );

        $this->traitsNode = $dom->createElementNS(
            'http://schema.phpunit.de/coverage/1.0',
            'traits'
        );

        $container->appendChild($this->linesNode);
        $container->appendChild($this->methodsNode);
        $container->appendChild($this->functionsNode);
        $container->appendChild($this->classesNode);
        $container->appendChild($this->traitsNode);
    }

    public function getContainer()
    {
        return $this->container;
    }

    public function setNumLines($loc, $cloc, $ncloc, $executable, $executed)
    {
        $this->linesNode->setAttribute('total', $loc);
        $this->linesNode->setAttribute('comments', $cloc);
        $this->linesNode->setAttribute('code', $ncloc);
        $this->linesNode->setAttribute('executable', $executable);
        $this->linesNode->setAttribute('executed', $executed);
        $this->linesNode->setAttribute(
            'percent',
            Util::percent($executed, $executable, true)
        );
    }

    public function setNumClasses($count, $tested)
    {
        $this->classesNode->setAttribute('count', $count);
        $this->classesNode->setAttribute('tested', $tested);
        $this->classesNode->setAttribute(
            'percent',
            Util::percent($tested, $count, true)
        );
    }

    public function setNumTraits($count, $tested)
    {
        $this->traitsNode->setAttribute('count', $count);
        $this->traitsNode->setAttribute('tested', $tested);
        $this->traitsNode->setAttribute(
            'percent',
            Util::percent($tested, $count, true)
        );
    }

    public function setNumMethods($count, $tested)
    {
        $this->methodsNode->setAttribute('count', $count);
        $this->methodsNode->setAttribute('tested', $tested);
        $this->methodsNode->setAttribute(
            'percent',
            Util::percent($tested, $count, true)
        );
    }

    public function setNumFunctions($count, $tested)
    {
        $this->functionsNode->setAttribute('count', $count);
        $this->functionsNode->setAttribute('tested', $tested);
        $this->functionsNode->setAttribute(
            'percent',
            Util::percent($tested, $count, true)
        );
    }
}
