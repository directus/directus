<?php

namespace Directus\Mail;

interface MailTypeInterface
{
    public function getBody();
    public function getSubject();
    public function getHeaders();
    public function getEmailAddress();
}