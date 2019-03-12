<?php

use Twig\Node\Expression\ArrayExpression;

class_exists('Twig\Node\Expression\ArrayExpression');

@trigger_error(sprintf('Using the "Twig_Node_Expression_Array" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\ArrayExpression" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\ArrayExpression" instead */
    class Twig_Node_Expression_Array extends ArrayExpression
    {
    }
}
