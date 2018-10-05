<?php

namespace Directus;

use Directus\Application\Application;
use Directus\Mail\Mailer;
use Directus\Mail\Message;
use Directus\Util\ArrayUtils;
use Directus\Util\StringUtils;

if (!function_exists('send_mail_with_template')) {
    /**
     * Sends a new email
     *
     * @param string $viewPath
     * @param array $data
     * @param callable $callback
     */
    function send_mail_with_template($viewPath, array $data, callable $callback)
    {
        $app = Application::getInstance();
        /** @var Mailer $mailer */
        $mailer = $app->getContainer()->get('mailer');

        $mailer->sendWithTemplate($viewPath, $data, $callback);
    }
}

if (!function_exists('send_mail_with_layout')) {
    /**
     * Sends a email using a layout for the given template
     *
     * @param string $layout
     * @param string $template
     * @param array $data
     * @param string $contentType
     * @param callable|null $callback
     */
    function send_mail_with_layout($layout, $template, array $data = [], $contentType = 'text/html', callable $callback = null)
    {
        $body = parse_body($template, $data);
        $body = parse_twig($layout, ['body' => $body]);

        send_mail_with_content($body, $contentType, $callback);
    }
}

if (!function_exists('send_mail_with_content')) {
    /**
     * Sends a new email with the given content
     *
     * @param string $body
     * @param string $contentType
     * @param callable $callback
     */
    function send_mail_with_content($body, $contentType = 'text/html', callable $callback)
    {
        $app = Application::getInstance();
        /** @var Mailer $mailer */
        $mailer = $app->getContainer()->get('mailer');

        $mailer->sendWithContent($body, $contentType, $callback);
    }
}

if (!function_exists('parse_body')) {
    /**
     * Parses body content
     *
     * @param string $content
     * @param array $data
     *
     * @return string
     */
    function parse_body($content, array $data = [])
    {
        if (is_array($data)) {
            $data = ArrayUtils::dot($data);
        }

        $content = strip_tags($content, implode('', get_safe_tags()));

        return StringUtils::replacePlaceholder($content, $data);
    }
}

if (!function_exists('get_safe_tags')) {
    /**
     * Get a list of safe tags
     *
     * @return array
     */
    function get_safe_tags()
    {
        return array_map(function ($tagName) {
            return '<' . $tagName . '>';
        }, ['b', 'button', 'a', 'i', 'h1']);
    }
}

if (!function_exists('parse_twig')) {
    /**
     * Parse twig view
     *
     * @param string $viewPath
     * @param array $data
     *
     * @return string
     */
    function parse_twig($viewPath, array $data)
    {
        $app = Application::getInstance();

        $mailSettings = [];
        $settings = $app->getContainer()->get('app_settings');
        foreach ($settings as $setting) {
            $mailSettings[$setting['scope']][$setting['key']] = $setting['value'];
        }

        $data = array_merge(['settings' => $mailSettings], $data);

        return $app->getContainer()->get('mail_view')->fetch($viewPath, $data);
    }
}

if (!function_exists('send_reset_password_email')) {
    /**
     * Sends a new password email
     *
     * @param $user
     * @param string $password
     */
    function send_reset_password_email($user, $password)
    {
        $data = [
            'new_password' => $password,
            'user_full_name' => $user->get('first_name') . ' ' . $user->get('last_name'),
        ];
        send_mail_with_template('reset-password.twig', $data, function (Message $message) use ($user) {
            $message->setSubject(
                sprintf('New Temporary Password: %s', get_directus_setting('global', 'project_name', ''))
            );
            $message->setTo($user['email']);
        });
    }
}

if (!function_exists('send_forgot_password_email')) {
    /**
     * Sends a new reset password email
     *
     * @param $user
     * @param string $token
     */
    function send_forgot_password_email($user, $token)
    {
        $data = [
            'reset_token' => $token,
            'user_full_name' => $user->get('first_name') . ' ' . $user->get('last_name'),
        ];
        send_mail_with_template('forgot-password.twig', $data, function (Message  $message) use ($user) {
            $message->setSubject(
                sprintf('Password Reset Request: %s', get_directus_setting('global', 'project_name', ''))
            );
            $message->setTo($user['email']);
        });
    }
}

if (!function_exists('send_new_install_email')) {
    /**
     * Sends a new installation email
     *
     * @param array $data
     */
    function send_new_install_email(array $data)
    {
        send_mail_with_template('new-install.twig', $data, function (Message $message) use ($data) {
            $message->setSubject(
                sprintf('Your New Instance: %s', get_directus_setting('global', 'project_name', ''))
            );
            $message->setTo($data['user']['email']);
        });
    }
}

if (!function_exists('send_user_invitation_email')) {
    /**
     * Sends a invitation email
     *
     * @param string $email
     * @param string $token
     */
    function send_user_invitation_email($email, $token)
    {
        $data = ['token' => $token];
        send_mail_with_template('user-invitation.twig', $data, function (Message $message) use ($email) {
            $message->setSubject(
                sprintf('Invitation to Instance: %s', get_directus_setting('global', 'project_name', ''))
            );
            $message->setTo($email);
        });
    }
}
