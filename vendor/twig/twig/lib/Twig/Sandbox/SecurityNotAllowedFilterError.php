<?php

use Twig\Sandbox\SecurityNotAllowedFilterError;

class_exists('Twig\Sandbox\SecurityNotAllowedFilterError');

@trigger_error(sprintf('Using the "Twig_Sandbox_SecurityNotAllowedFilterError" class is deprecated since Twig version 2.7, use "Twig\Sandbox\SecurityNotAllowedFilterError" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Sandbox\SecurityNotAllowedFilterError" instead */
    class Twig_Sandbox_SecurityNotAllowedFilterError extends SecurityNotAllowedFilterError
    {
    }
}
