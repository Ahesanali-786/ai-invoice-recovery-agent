<?php

use App\Http\Controllers\API\AIAgentController;
use App\Http\Controllers\API\AnalyticsController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\ClientController;
use App\Http\Controllers\API\CommunicationController;
use App\Http\Controllers\API\DashboardController;
use App\Http\Controllers\API\EmailTemplateController;
use App\Http\Controllers\API\EmailWebhookController;
use App\Http\Controllers\API\InvoiceController;
use App\Http\Controllers\API\OrganizationController;
use App\Http\Controllers\API\ReminderController;
use App\Http\Controllers\API\SmartReminderController;
use App\Http\Controllers\API\WhatsAppWebhookController;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Explicit binding for Organization to use ID in API routes
Route::bind('organization', function ($value) {
    return Organization::where('id', $value)->firstOrFail();
});

Route::get('/health', fn() => ['status' => 'ok']);

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/google', [AuthController::class, 'redirectToGoogle']);
    Route::get('/google/callback', [AuthController::class, 'handleGoogleCallback']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::put('/settings', [AuthController::class, 'updateSettings']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::post('/avatar/upload', [AuthController::class, 'uploadAvatar']);
    Route::delete('/avatar', [AuthController::class, 'removeAvatar']);

    // Organization Routes
    Route::get('/organizations', [OrganizationController::class, 'index']);
    Route::post('/organizations', [OrganizationController::class, 'store']);
    Route::get('/organizations/{organization}', [OrganizationController::class, 'show']);
    Route::put('/organizations/{organization}', [OrganizationController::class, 'update']);
    Route::delete('/organizations/{organization}', [OrganizationController::class, 'destroy']);
    Route::post('/organizations/{organization}/switch', [OrganizationController::class, 'switchOrganization']);
    Route::get('/organizations/{organization}/members', [OrganizationController::class, 'members']);
    Route::post('/organizations/{organization}/invite', [OrganizationController::class, 'inviteMember']);
    Route::put('/organizations/{organization}/members/{user}', [OrganizationController::class, 'updateMemberRole']);
    Route::delete('/organizations/{organization}/members/{user}', [OrganizationController::class, 'removeMember']);
    Route::get('/organizations/invitations/pending', [OrganizationController::class, 'getPendingInvitations']);
    Route::post('/organizations/invitations/accept', [OrganizationController::class, 'acceptInvitation']);

    // Analytics Routes
    Route::middleware(\App\Http\Middleware\EnsureTenantAccess::class)->group(function () {
        Route::get('/analytics/dashboard', [AnalyticsController::class, 'dashboard']);
        Route::get('/analytics/revenue-forecast', [AnalyticsController::class, 'revenueForecast']);
        Route::get('/analytics/at-risk', [AnalyticsController::class, 'atRiskInvoices']);
        Route::get('/analytics/payment-behavior', [AnalyticsController::class, 'paymentBehavior']);
        Route::get('/analytics/cash-flow', [AnalyticsController::class, 'cashFlow']);
        Route::post('/analytics/refresh', [AnalyticsController::class, 'refresh']);
    });

    Route::apiResource('clients', ClientController::class);

    Route::get('/invoices/next-number', [InvoiceController::class, 'getNextInvoiceNumber']);
    Route::apiResource('invoices', InvoiceController::class);

    Route::post('/invoices/{invoice}/mark-paid', [InvoiceController::class, 'markAsPaid']);
    Route::get('/invoices/stats/dashboard', [InvoiceController::class, 'dashboardStats']);
    Route::get('/invoices/{invoice}/pdf/download', [InvoiceController::class, 'downloadPdf']);
    Route::get('/invoices/{invoice}/pdf/stream', [InvoiceController::class, 'streamPdf']);

    Route::post('/invoices/{invoice}/reminders', [ReminderController::class, 'sendReminder']);
    Route::get('/invoices/{invoice}/reminders', [ReminderController::class, 'index']);

    // AI Agent Routes
    Route::middleware(\App\Http\Middleware\EnsureTenantAccess::class)->prefix('ai-agent')->group(function () {
        Route::get('/status', [AIAgentController::class, 'status']);
        Route::get('/insights', [AIAgentController::class, 'insights']);
        Route::get('/messages', [AIAgentController::class, 'messages']);
        Route::post('/chat', [AIAgentController::class, 'chat']);
        Route::post('/execute', [AIAgentController::class, 'execute']);
        Route::post('/search', [AIAgentController::class, 'search']);
    });

    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Smart Automated Reminders Routes
    Route::prefix('smart-reminders')->group(function () {
        Route::get('/', [SmartReminderController::class, 'index']);
        Route::post('/start', [SmartReminderController::class, 'startAutomation']);
        Route::post('/process', [SmartReminderController::class, 'processReminders']);
        Route::post('/stop/{id}', [SmartReminderController::class, 'stopAutomation']);
        Route::post('/preview', [SmartReminderController::class, 'previewReminder']);
        Route::get('/client-behavior/{clientId}', [SmartReminderController::class, 'getClientBehavior']);
        Route::get('/client-behaviors', [SmartReminderController::class, 'getAllClientBehaviors']);
        Route::post('/batch-analyze', [SmartReminderController::class, 'batchAnalyze']);
    });

    // Payment Webhook Route
    Route::post('/webhooks/payment', [SmartReminderController::class, 'handlePaymentWebhook']);

    // Email Webhook Routes (Public - for receiving replies from SendGrid/Mailgun)
    Route::post('/webhooks/email', [EmailWebhookController::class, 'handleIncomingEmail']);
    Route::get('/webhooks/email/health', [EmailWebhookController::class, 'healthCheck']);

    // Communication Routes (Email + WhatsApp Conversations)
    Route::prefix('communications')->group(function () {
        Route::get('/', [CommunicationController::class, 'getConversations']);
        Route::get('/unread-count', [CommunicationController::class, 'getUnreadCount']);
        Route::post('/start-from-invoice', [CommunicationController::class, 'startConversationFromInvoice']);
        Route::get('/client/{clientId}', [CommunicationController::class, 'getClientConversations']);
        Route::get('/{id}', [CommunicationController::class, 'getConversation']);
        Route::post('/{id}/reply', [CommunicationController::class, 'sendReply']);
        Route::post('/{id}/close', [CommunicationController::class, 'closeConversation']);
    });

    // Email Templates Routes
    Route::prefix('email-templates')->group(function () {
        Route::get('/', [EmailTemplateController::class, 'index']);
        Route::get('/{type}', [EmailTemplateController::class, 'show']);
        Route::post('/', [EmailTemplateController::class, 'store']);
        Route::put('/{id}', [EmailTemplateController::class, 'update']);
        Route::delete('/{id}', [EmailTemplateController::class, 'destroy']);
        Route::get('/defaults/{type}', [EmailTemplateController::class, 'getDefaultTemplate']);
        Route::post('/preview', [EmailTemplateController::class, 'preview']);
    });
});

Route::post('/webhooks/whatsapp', [WhatsAppWebhookController::class, 'handle']);
Route::get('/webhooks/whatsapp', [WhatsAppWebhookController::class, 'verify']);
