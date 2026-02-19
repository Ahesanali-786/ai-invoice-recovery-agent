<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public array $emailData;

    public function __construct(array $emailData)
    {
        $this->emailData = $emailData;
    }

    public function build(): self
    {
        return $this
            ->subject($this->emailData['subject'])
            ->from(config('mail.from.address'), config('mail.from.name'))
            ->html($this->emailData['body']);
    }
}
