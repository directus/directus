<?php

namespace Directus\Installation\Steps;

class CheckRequirementsStep extends AbstractStep
{
    protected $number = 0;
    protected $name = 'check_requirements';
    protected $title = 'Check Requirements';
    protected $shortTitle = 'Requirements';
    protected $viewName = 'check_requirements.twig';
    protected $fields = [];

    public function preRun(&$state)
    {
        parent::preRun($state);

        $errors = get_missing_requirements();

        $this->response = new StepResponse([]);
        if ($errors) {
            $this->response->addError($errors);
        }

        return $this->response;
    }
}
