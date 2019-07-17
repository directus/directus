<?php

namespace Directus\Validator;

use Directus\Validator\Constraints\DateTime;
use Directus\Validator\Constraints\Required;
use Directus\Validator\Exception\UnknownConstraintException;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\Constraints\Date;
use Symfony\Component\Validator\Constraints\Email;
use Symfony\Component\Validator\Constraints\NotNull;
use Symfony\Component\Validator\Constraints\Regex;
use Symfony\Component\Validator\Constraints\Time;
use Symfony\Component\Validator\Constraints\Type;
use Symfony\Component\Validator\ConstraintViolation;
use Symfony\Component\Validator\ConstraintViolationList;
use Symfony\Component\Validator\Exception\UnexpectedTypeException;
use Symfony\Component\Validator\Validation;

class Validator
{
    /**
     * @var \Symfony\Component\Validator\Validator\ValidatorInterface
     */
    protected $provider;

    public function __construct()
    {
        $this->provider = Validation::createValidator();
    }

    /**
     * @param mixed $value
     * @param array $constraints
     *
     * @return \Symfony\Component\Validator\ConstraintViolationListInterface
     */
    public function validate($value, array $constraints)
    {
        // TODO: Support OR validation
        // Ex. value must be Numeric or string type (Scalar without boolean)
        try {
            $violations = $this->provider->validate($value, $this->createConstraintFromList($constraints));
        } catch (UnexpectedTypeException $e) {
            $message = $e->getMessage();
           
            preg_match('/Expected argument of type "(.*)", "(.*)" given/', $message, $matches);
            if (count($matches) === 3) {
                $message = 'This value should be of type ' . $matches[1];
            }

            $violations = new ConstraintViolationList();
            $violations->add(new ConstraintViolation($message . '.', '', [], '', '', ''));
        }

        return $violations;
    }

    /**
     * @return \Symfony\Component\Validator\Validator\ValidatorInterface
     */
    public function getProvider()
    {
        return $this->provider;
    }

    /**
     * Gets constraint with the given name
     *
     * @param string $name
     * @param string $options
     *
     * @return null|Constraint
     *
     * @throws UnknownConstraintException
     */
    public function getConstraint($name, $options = null)
    {
        $constraint = null;

        switch ($name) {
            case 'required':
                $constraint = new Required();
                break;
            case 'notnullable':
                $constraint = new NotNull();
                break;
            case 'email':
                $constraint = new Email();
                break;
            case 'json':
                $constraint = new Type(['type' => 'array', 'message' => 'This value should be of type json.']);
                break;
            case 'array':
            case 'numeric':
            case 'string':
            case 'bool':
                $constraint = new Type(['type' => $name]);
                break;
            case 'date':
                $constraint = new Date();
                break;
            case 'time':
                $constraint = new Time();
                break;
            case 'datetime':
                $constraint = new DateTime();
                break;
            case 'regex':
                $constraint = new Regex(['pattern' => $options]);
                break;
            default:
                throw new UnknownConstraintException(sprintf('Unknown "%s" constraint', $name));
        }

        return $constraint;
    }

    /**
     * Creates constraints object from name
     *
     * @param array $constraints
     *
     * @return Constraint[]
     */
    protected function createConstraintFromList(array $constraints)
    {
        $constraintsObjects = [];

        foreach ($constraints as $constraint) {
            $options = null;
    
            // NOTE: Simple implementation to adapt a new regex validation and its pattern
            if (strpos($constraint, ':')) {
                $constraintParts = explode(':', $constraint);
                $constraint = $constraintParts[0];
                $options = $constraintParts[1];
            }

            $constraintsObjects[] = $this->getConstraint($constraint, $options);
        }
        
        return $constraintsObjects;
    }
}
