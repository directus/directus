<?php

use Twig\Node\Expression\NullCoalesceExpression;

class_exists('Twig\Node\Expression\NullCoalesceExpression');

@trigger_error(sprintf('Using the "Twig_Node_Expression_NullCoalesce" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\NullCoalesceExpression" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\NullCoalesceExpression" instead */
    class Twig_Node_Expression_NullCoalesce extends NullCoalesceExpression
    {
    }
}
