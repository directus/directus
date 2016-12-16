<?php

namespace Directus\Installation;

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

        $output = static::getStepView($step, $state, ['state' => $state, 'step' => $step, 'data' => $stepsData]);

        $view_path = $state['settings']['views_path'];
        echo static::getView($view_path . '/base.php', array_merge(
                $state,
                ['step' => $step, 'content' => $output]
            )
        );

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
        $view_path = $state['settings']['views_path'];
        $data = array_merge($state, $data);
        return static::getView(rtrim($view_path, '/') . '/' . $step->getViewName(), $data);
    }

    /**
     * Get the view rendered content
     * @param  string $path view path
     * @param  array $data Data to be injected in the views
     * @return string       view output content
     */
    public static function getView($path, $data = [])
    {
        $render = function ($path, $data) {
            extract($data);
            include $path;
        };

        ob_start();
        $render($path, $data);

        return ob_get_clean();
    }
}
