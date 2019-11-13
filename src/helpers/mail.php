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
        }, ['b', 'i', 'a', 'p', 'br', 'hr', 'button', 'h1', 'h2', 'h3', 'h4', 'h5', 'table', 'thead', 'tbody', 'tfoot', 'th', 'tr', 'td']);
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

        $mailDefaultSettings = [
            'project_url' => get_url(),
        ];

        $settings = $app->getContainer()->get('app_settings');
        $mailSettings = [];
        foreach ($settings as $setting) {
            $mailSettings[$setting['key']] = $setting['value'];
        }

        $data = array_merge([
            'settings' => ArrayUtils::defaults(
                $mailDefaultSettings,
                // Remove NULL and Empty values
                array_filter($mailSettings, function ($v) {
                    return $v !== null && $v !== '';
                })
            )
        ], $data);

        return $app->getContainer()->get('mail_view')->fetch($viewPath, $data);
    }
}

if (!function_exists('send_forgot_password_email')) {
    /**
     * Sends a new reset password email
     *
     * @param array $user
     * @param string $token
     */
    function send_forgot_password_email(array $user, $url)
    {
        $data = [
            'reset_url' => $url,
            'user_full_name' => get_user_full_name($user),
        ];
        send_mail_with_template('reset-password.twig', $data, function (Message  $message) use ($user) {
            $message->setSubject(
                sprintf('Password Reset Request: %s', get_directus_setting('project_name', ''))
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
                sprintf('Your New Instance: %s', get_directus_setting('project_name', ''))
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
                sprintf('Invitation to Instance: %s', get_directus_setting('project_name', ''))
            );
            $message->setTo($email);
        });
    }
}

if (!function_exists('get_user_full_name')) {
    /**
     * Returns the user full name based on the data.first_name and data.last_name
     *
     * @param array $data
     *
     * @return string
     */
    function get_user_full_name(array $data)
    {
        $names = array_filter(
            [array_get($data, 'first_name'), array_get($data, 'last_name')]
        );

        return !empty($names) ? implode(' ', $names) : '';
    }
}
