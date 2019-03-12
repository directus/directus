<?php

use Twig\Error\RuntimeError;

class_exists('Twig\Error\RuntimeError');

@trigger_error(sprintf('Using the "Twig_Error_Runtime" class is deprecated since Twig version 2.7, use "Twig\Error\RuntimeError" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Error\RuntimeError" instead */
    class Twig_Error_Runtime extends RuntimeError
    {
    }
}
