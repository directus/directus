<?php

use Directus\Mail\Mail;

if (!function_exists('send_email')) {
    /**
     * Sends a new email
     *
     * @param string $view
     * @param array $data
     * @param callable $callback
     */
    function send_email($view, array $data, callable $callback)
    {
        Mail::send($view, $data, $callback);
    }
}

if (!function_exists('send_forgot_password_email')) {
    /**
     * Sends a new password email
     *
     * @param $user
     * @param string $password
     */
    function send_forgot_password_email($user, $password)
    {
        $data = ['new_password' => $password];
        send_email('mail/forgot-password.twig.html', $data, function (Swift_Message $message) use ($user) {
            $message->setSubject(__t('password_reset_new_password_email_subject'));
            $message->setTo($user['email']);
        });
    }
}

if (!function_exists('send_reset_password_email')) {
    /**
     * Sends a new reset password email
     *
     * @param $user
     * @param string $token
     */
    function send_reset_password_email($user, $token)
    {
        $data = ['reset_token' => $token];
        Mail::send('mail/reset-password.twig.html', $data, function (Swift_Message $message) use ($user) {
            $message->setSubject(__t('password_forgot_password_reset_email_subject'));
            $message->setTo($user['email']);
        });
    }
}

if (!function_exists('send_message_notification_email')) {
    /**
     * Sends a new message notification
     *
     * @param $user
     * @param array $payload
     */
    function send_message_notification_email($user, array $payload)
    {
        $data = ['message' => $payload['message']];
        Mail::send('mail/notification.twig.html', $data, function (Swift_Message $message) use ($user, $payload) {
            $message->setSubject($payload['subject']);
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
        Mail::send('mail/new-install.twig.html', $data, function (Swift_Message $message) use ($data) {
            $message->setSubject(__t('email_subject_your_new_directus_instance_x', [
                'name' => $data['project']['name']
            ]));
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
        Mail::send('mail/user-invitation.twig.html', $data, function (Swift_Message $message) use ($email) {
            // TODO: Add a proper invitation subject
            $message->setSubject('Invitation');
            $message->setTo($email);
        });
    }
}
