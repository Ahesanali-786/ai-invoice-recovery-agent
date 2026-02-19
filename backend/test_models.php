<?php

require __DIR__ . '/vendor/autoload.php';

use App\Models\AIAgentActivity;
use App\Models\AIAgentMessage;

try {
    echo "Testing AI Models...\n";

    $app = require_once __DIR__ . '/bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();

    echo "App booted successfully.\n";

    // Test AIAgentMessage
    $msg = new AIAgentMessage();
    echo "AIAgentMessage model instantiated.\n";
    echo 'Table: ' . $msg->getTable() . "\n";

    // Test AIAgentActivity
    $act = new AIAgentActivity();
    echo "AIAgentActivity model instantiated.\n";
    echo 'Table: ' . $act->getTable() . "\n";

    // Try a simple query
    $count = AIAgentMessage::count();
    echo 'AIAgentMessage count: ' . $count . "\n";
} catch (Throwable $e) {
    echo 'ERROR: ' . $e->getMessage() . "\n";
    echo 'Trace: ' . $e->getTraceAsString() . "\n";
}
