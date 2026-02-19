<?php

namespace App\Mail;

use App\Models\EmailTemplate;
use App\Models\Organization;
use App\Models\OrganizationInvitation;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OrganizationInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public OrganizationInvitation $invitation;
    public Organization $organization;
    public User $inviter;
    public string $acceptUrl;

    public function __construct(OrganizationInvitation $invitation)
    {
        $this->invitation = $invitation;
        $this->organization = $invitation->organization;
        $this->inviter = $invitation->inviter;
        $this->acceptUrl = config('app.frontend_url', 'http://localhost:5173') . '/accept-invitation?token=' . $invitation->token;
    }

    public function build(): self
    {
        $customTemplate = EmailTemplate::getCustomOrDefault(
            $this->inviter->id,
            'organization_invitation'
        );

        if ($customTemplate) {
            return $this->buildWithCustomTemplate($customTemplate);
        }

        return $this->buildWithDefaultTemplate();
    }

    private function buildWithDefaultTemplate(): self
    {
        return $this
            ->subject("You've been invited to join {$this->organization->name}")
            ->from(config('mail.from.address'), config('mail.from.name'))
            ->view('emails.organization-invitation')
            ->with([
                'invitation' => $this->invitation,
                'organization' => $this->organization,
                'inviter' => $this->inviter,
                'acceptUrl' => $this->acceptUrl,
            ]);
    }

    private function buildWithCustomTemplate(EmailTemplate $template): self
    {
        $variables = $this->getTemplateVariables();
        $parsedBody = $template->parseVariables($variables);
        $parsedSubject = $this->parseSubject($template->subject, $variables);

        return $this
            ->subject($parsedSubject)
            ->from(config('mail.from.address'), config('mail.from.name'))
            ->html($parsedBody);
    }

    private function getTemplateVariables(): array
    {
        return [
            'inviter_name' => $this->inviter->name,
            'inviter_email' => $this->inviter->email,
            'organization_name' => $this->organization->name,
            'invitation_role' => ucfirst($this->invitation->role),
            'accept_url' => $this->acceptUrl,
            'expires_at' => $this->invitation->expires_at->format('F j, Y'),
            'app_name' => config('app.name', 'Invoice Recovery'),
            'year' => date('Y'),
        ];
    }

    private function parseSubject(string $subject, array $variables): string
    {
        foreach ($variables as $key => $value) {
            $placeholder = '{{ ' . $key . ' }}';
            $subject = str_replace($placeholder, $value, $subject);
        }

        return $subject;
    }
}
