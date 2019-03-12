<?php

use Twig\Node\Expression\FilterExpression;

class_exists('Twig\Node\Expression\FilterExpression');

@trigger_error(sprintf('Using the "Twig_Node_Expression_Filter" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\FilterExpression" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\FilterExpression" instead */
    class Twig_Node_Expression_Filter extends FilterExpression
    {
    }
}
