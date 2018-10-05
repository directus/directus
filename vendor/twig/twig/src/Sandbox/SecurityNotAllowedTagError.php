<?php

namespace Twig\Sandbox;

class_exists('Twig_Sandbox_SecurityNotAllowedTagError');

if (\false) {
    class SecurityNotAllowedTagError extends \Twig_Sandbox_SecurityNotAllowedTagError
    {
    }
}
