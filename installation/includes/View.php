<?php

namespace Directus\Installation;

use Directus\Installation\Extensions\DirectusTwigHelpers;
use Directus\View\Twig\DirectusTwigExtension;
use Slim\Extras\Views\Twig;

class View
{
    /**
     * @var We use this to save a twig instance
     */
    private static $view;

    /**
     * Display a step view
     * @param $step
     * @param $state
     */
    public static function displayStep($step, $state)
    {
        $stepsData = [];
        foreach ($state['steps'] as $aStep) {
            if ($stepData = $aStep->getData()) {
                $stepsData = array_merge($stepsData, $stepData);
            }
        }

        $stepsData = new DataContainer($stepsData);

        // We're ready to setup twig!
        self::$view = static::setupTwigView($state);

        // Render the step template with the data
        echo static::getStepView($step, $state, [
            'state' => $state,
            'step' => $step,
            'data' => $stepsData
        ]);

        $step->getResponse()->clearAll();
    }

    /**
     * Get the template rendered content
     * @param  array $step Step information
     * @param  array $state - Installation state array
     * @param  array $data Data to be injected in the views
     * @return string       view output content
     */
    public static function getStepView($step, $state, array $data = [])
    {
        // @todo: Find a way so we can set data without a key
        self::$view->set('directus', array_merge($state, $data));
        return self::$view->render($step->getViewName());
    }

    /**
     * Set up Twig extensions and template dirs
     * @param  Array $state - Installation state array
     * @return Object        Twig instance
     */
    public static function setupTwigView($state)
    {
        $view_path = $state['settings']['views_path'];

        // Add twig extensions
        Twig::$twigExtensions = [
            new DirectusTwigExtension(),
            new DirectusTwigHelpers()
        ];

        // Add installation view path to twig template dirs
        Twig::$twigTemplateDirs = $view_path;
        return new Twig();
    }
}
