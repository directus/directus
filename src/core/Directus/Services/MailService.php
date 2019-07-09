<?php

namespace Directus\Services;

use Directus\Database\Schema\SchemaManager;
use Directus\Database\TableGateway\DirectusUsersTableGateway;
use Directus\Exception\UnprocessableEntityException;
use Directus\Mail\Message;
use Directus\Permissions\Acl;
use function Directus\send_mail_with_layout;
use Directus\Util\ArrayUtils;
use Directus\Validator\Validator;
use Zend\Db\Sql\Predicate\In;

class MailService extends AbstractService
{
    public function send(array $data)
    {
        $this->validate($data, [
            'type' => 'string',
            'subject' => 'string',
            'body' => 'required|string',
            'data' => 'array',
            'to' => 'required'
        ]);

        $acl = $this->container->get('acl');

        $subject = ArrayUtils::get($data, 'subject');
        $toAddresses = $this->getToAddresses(ArrayUtils::get($data, 'to'));

        $useDefaultEmail = isset($data['use_default_email']) && $acl->isAdmin() ? $data['use_default_email'] : false;
        send_mail_with_layout(
            $data['type'] == 'plain' ? 'plain.twig' : 'base.twig',
            $data['body'],
            (array) ArrayUtils::get($data, 'data'),
            $data['type'] == 'plain' ? 'text/plain' : 'text/html',
            function (Message $message) use ($data, $toAddresses, $subject, $useDefaultEmail) {
                $message->setFrom($this->getFrom($useDefaultEmail));
                $message->setTo($toAddresses);
                $message->setSubject($subject);
            }
        );
    }

    /**
     * Returns the list of 'to' addresses
     *
     * @param $addresses
     *
     * @return array
     */
    protected function getToAddresses($addresses)
    {
        if (!is_array($addresses) || !ArrayUtils::isNumericKeys($addresses)) {
            $addresses = [$addresses];
        }

        $this->validateAddresses($addresses);

        return $this->parseAddresses($addresses);
    }

    /**
     * Validate a list of addresses
     *
     * @param array $addresses
     *
     * @throws UnprocessableEntityException
     */
    protected function validateAddresses(array $addresses)
    {
        $validator = new Validator();
        foreach ($addresses as $address) {
            if (is_array($address) && (!isset($address['name']) || !isset($address['email']))) {
                throw new UnprocessableEntityException(
                    'Addressee if an array, it must have a name and an email attribute'
                );
            }

            if (is_string($addresses)) {
                $violations = $validator->validate($addresses, ['required|email']);
                if ($violations->count() > 0) {
                    throw new UnprocessableEntityException(
                        'Invalid email'
                    );
                }
            }

            if (!is_numeric($address) && !is_string($address) && !is_array($address)) {
                throw new UnprocessableEntityException(
                    'Address must be a string, number or an array'
                );
            }
        }
    }

    /**
     * Parses a list of address into
     *
     * @param array $addresses
     *
     * @return array
     *
     * @throws UnprocessableEntityException
     */
    protected function parseAddresses(array $addresses)
    {
        $ids = [];
        foreach ($addresses as $i => $address) {
            if (is_numeric($address)) {
                $ids[] = $address;
                unset($addresses[$i]);
            } else if (is_array($address)) {
                unset($addresses[$i]);
                $addresses[ArrayUtils::get($address, 'email')] = ArrayUtils::get($address, 'name');
            }
        }

        if ($ids) {
            $users = $this->fetchItems(
                SchemaManager::COLLECTION_USERS,
                ['email', 'first_name', 'last_name'],
                [new In('id', $ids), 'status' => DirectusUsersTableGateway::STATUS_ACTIVE]
            );

            if ($users->count() !== count($ids)) {
                throw new UnprocessableEntityException(
                    'Unable to find some users'
                );
            }

            foreach ($users as $user) {
                $name = [];
                if ($user->first_name) {
                    $name[] = $user->first_name;
                }

                if ($user->last_name) {
                    $name[] = $user->last_name;
                }

                if ($name) {
                    $addresses[$user->email] = implode(' ', $name);
                } else {
                    $addresses[] = $user->email;
                }
            }
        }

        return $addresses;
    }

    /**
     * Returns the authenticated user address
     *
     * @return array
     */

    protected function getFrom($defaultEmail = false)
    {
        /** @var Acl $acl */
        $acl = $this->container->get('acl');
        if ($defaultEmail) {
            $config = $this->container->get('config');
            return  [
                 $config->get('mail.default.from') => $acl->getUserFullName()
            ];
        }
        else {
            return [
                $acl->getUserEmail() => $acl->getUserFullName()
            ];
        }
    }
}
