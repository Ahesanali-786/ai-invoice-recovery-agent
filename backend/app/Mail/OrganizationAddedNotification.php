<?php

namespace App\Mail;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OrganizationAddedNotification extends Mailable
{
    use Queueable, SerializesModels;

    public Organization $organization;
    public User $addedUser;
    public User $addedBy;

    public function __construct(Organization $organization, User $addedUser, User $addedBy)
    {
        $this->organization = $organization;
        $this->addedUser = $addedUser;
        $this->addedBy = $addedBy;
    }

    public function build(): self
    {
        return $this
            ->subject("You've been added to {$this->organization->name}")
            ->from(config('mail.from.address'), config('mail.from.name'))
            ->view('emails.organization-added')
            ->with([
                'organization' => $this->organization,
                'addedUser' => $this->addedUser,
                'addedBy' => $this->addedBy,
                'loginUrl' => config('app.frontend_url', 'http://localhost:5173') . '/login',
            ]);
    }
}
