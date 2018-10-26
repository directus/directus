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

class Report extends File
{
    public function __construct($name)
    {
        $this->dom = new \DOMDocument;
        $this->dom->loadXML('<?xml version="1.0" ?><phpunit xmlns="http://schema.phpunit.de/coverage/1.0"><file /></phpunit>');

        $this->contextNode = $this->dom->getElementsByTagNameNS(
            'http://schema.phpunit.de/coverage/1.0',
            'file'
        )->item(0);

        $this->setName($name);
    }

    private function setName($name)
    {
        $this->contextNode->setAttribute('name', $name);
    }

    public function asDom()
    {
        return $this->dom;
    }

    public function getFunctionObject($name)
    {
        $node = $this->contextNode->appendChild(
            $this->dom->createElementNS(
                'http://schema.phpunit.de/coverage/1.0',
                'function'
            )
        );

        return new Method($node, $name);
    }

    public function getClassObject($name)
    {
        return $this->getUnitObject('class', $name);
    }

    public function getTraitObject($name)
    {
        return $this->getUnitObject('trait', $name);
    }

    private function getUnitObject($tagName, $name)
    {
        $node = $this->contextNode->appendChild(
            $this->dom->createElementNS(
                'http://schema.phpunit.de/coverage/1.0',
                $tagName
            )
        );

        return new Unit($node, $name);
    }
}
