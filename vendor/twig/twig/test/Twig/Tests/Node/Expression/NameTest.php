<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

use Twig\Environment;
use Twig\Loader\LoaderInterface;
use Twig\Node\Expression\NameExpression;
use Twig\Test\NodeTestCase;

class Twig_Tests_Node_Expression_NameTest extends NodeTestCase
{
    public function testConstructor()
    {
        $node = new NameExpression('foo', 1);

        $this->assertEquals('foo', $node->getAttribute('name'));
    }

    public function getTests()
    {
        $node = new NameExpression('foo', 1);
        $self = new NameExpression('_self', 1);
        $context = new NameExpression('_context', 1);

        $env = new Environment($this->getMockBuilder(LoaderInterface::class)->getMock(), ['strict_variables' => true]);
        $env1 = new Environment($this->getMockBuilder(LoaderInterface::class)->getMock(), ['strict_variables' => false]);

        $output = '(isset($context["foo"]) || array_key_exists("foo", $context) ? $context["foo"] : (function () { throw new RuntimeError(\'Variable "foo" does not exist.\', 1, $this->source); })())';

        return [
            [$node, "// line 1\n".$output, $env],
            [$node, $this->getVariableGetter('foo', 1), $env1],
            [$self, "// line 1\n\$this->getTemplateName()"],
            [$context, "// line 1\n\$context"],
        ];
    }
}
