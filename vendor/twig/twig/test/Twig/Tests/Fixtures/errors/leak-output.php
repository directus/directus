<?php

require __DIR__.'/../../../../../vendor/autoload.php';

use Twig\Environment;
use Twig\Extension\AbstractExtension;
use Twig\Loader\ArrayLoader;
use Twig\TwigFilter;

class BrokenExtension extends AbstractExtension
{
    public function getFilters()
    {
        return [
            new TwigFilter('broken', [$this, 'broken']),
        ];
    }

    public function broken()
    {
        die('OOPS');
    }
}

$loader = new ArrayLoader([
    'index.html.twig' => 'Hello {{ "world"|broken }}',
]);
$twig = new Environment($loader, ['debug' => isset($argv[1])]);
$twig->addExtension(new BrokenExtension());

echo $twig->render('index.html.twig');
