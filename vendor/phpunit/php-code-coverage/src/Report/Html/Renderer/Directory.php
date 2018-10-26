<?php
/*
 * This file is part of the php-code-coverage package.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace SebastianBergmann\CodeCoverage\Report\Html;

use SebastianBergmann\CodeCoverage\Node\AbstractNode as Node;
use SebastianBergmann\CodeCoverage\Node\Directory as DirectoryNode;

/**
 * Renders a directory node.
 */
class Directory extends Renderer
{
    /**
     * @param DirectoryNode $node
     * @param string        $file
     */
    public function render(DirectoryNode $node, $file)
    {
        $template = new \Text_Template($this->templatePath . 'directory.html', '{{', '}}');

        $this->setCommonTemplateVariables($template, $node);

        $items = $this->renderItem($node, true);

        foreach ($node->getDirectories() as $item) {
            $items .= $this->renderItem($item);
        }

        foreach ($node->getFiles() as $item) {
            $items .= $this->renderItem($item);
        }

        $template->setVar(
            [
                'id'    => $node->getId(),
                'items' => $items
            ]
        );

        $template->renderTo($file);
    }

    /**
     * @param Node $node
     * @param bool $total
     *
     * @return string
     */
    protected function renderItem(Node $node, $total = false)
    {
        $data = [
            'numClasses'                   => $node->getNumClassesAndTraits(),
            'numTestedClasses'             => $node->getNumTestedClassesAndTraits(),
            'numMethods'                   => $node->getNumMethods(),
            'numTestedMethods'             => $node->getNumTestedMethods(),
            'linesExecutedPercent'         => $node->getLineExecutedPercent(false),
            'linesExecutedPercentAsString' => $node->getLineExecutedPercent(),
            'numExecutedLines'             => $node->getNumExecutedLines(),
            'numExecutableLines'           => $node->getNumExecutableLines(),
            'testedMethodsPercent'         => $node->getTestedMethodsPercent(false),
            'testedMethodsPercentAsString' => $node->getTestedMethodsPercent(),
            'testedClassesPercent'         => $node->getTestedClassesAndTraitsPercent(false),
            'testedClassesPercentAsString' => $node->getTestedClassesAndTraitsPercent()
        ];

        if ($total) {
            $data['name'] = 'Total';
        } else {
            if ($node instanceof DirectoryNode) {
                $data['name'] = sprintf(
                    '<a href="%s/index.html">%s</a>',
                    $node->getName(),
                    $node->getName()
                );

                $data['icon'] = '<span class="glyphicon glyphicon-folder-open"></span> ';
            } else {
                $data['name'] = sprintf(
                    '<a href="%s.html">%s</a>',
                    $node->getName(),
                    $node->getName()
                );

                $data['icon'] = '<span class="glyphicon glyphicon-file"></span> ';
            }
        }

        return $this->renderItemTemplate(
            new \Text_Template($this->templatePath . 'directory_item.html', '{{', '}}'),
            $data
        );
    }
}
