<?php

use Twig\Node\Expression\ParentExpression;

class_exists('Twig\Node\Expression\ParentExpression');

@trigger_error(sprintf('Using the "Twig_Node_Expression_Parent" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\ParentExpression" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\ParentExpression" instead */
    class Twig_Node_Expression_Parent extends ParentExpression
    {
    }
}
