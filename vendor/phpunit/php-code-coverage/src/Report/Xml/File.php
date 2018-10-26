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

class File
{
    /**
     * @var \DOMDocument
     */
    protected $dom;

    /**
     * @var \DOMElement
     */
    protected $contextNode;

    public function __construct(\DOMElement $context)
    {
        $this->dom         = $context->ownerDocument;
        $this->contextNode = $context;
    }

    public function getTotals()
    {
        $totalsContainer = $this->contextNode->firstChild;

        if (!$totalsContainer) {
            $totalsContainer = $this->contextNode->appendChild(
                $this->dom->createElementNS(
                    'http://schema.phpunit.de/coverage/1.0',
                    'totals'
                )
            );
        }

        return new Totals($totalsContainer);
    }

    public function getLineCoverage($line)
    {
        $coverage = $this->contextNode->getElementsByTagNameNS(
            'http://schema.phpunit.de/coverage/1.0',
            'coverage'
        )->item(0);

        if (!$coverage) {
            $coverage = $this->contextNode->appendChild(
                $this->dom->createElementNS(
                    'http://schema.phpunit.de/coverage/1.0',
                    'coverage'
                )
            );
        }

        $lineNode = $coverage->appendChild(
            $this->dom->createElementNS(
                'http://schema.phpunit.de/coverage/1.0',
                'line'
            )
        );

        return new Coverage($lineNode, $line);
    }
}
