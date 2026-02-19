<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Invoice {{ $invoice->invoice_number }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #333;
        }
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #2c3e50;
        }
        .company-info {
            flex: 1;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
        }
        .company-details {
            font-size: 10px;
            color: #666;
            line-height: 1.6;
        }
        .invoice-title {
            text-align: right;
        }
        .invoice-title h1 {
            font-size: 28px;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        .status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: bold;
            color: white;
            background-color: {{ $status['color'] }};
        }
        .invoice-meta {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        .bill-to, .invoice-details {
            flex: 1;
        }
        .bill-to {
            margin-right: 40px;
        }
        .section-title {
            font-size: 11px;
            font-weight: bold;
            color: #2c3e50;
            text-transform: uppercase;
            margin-bottom: 10px;
            letter-spacing: 1px;
        }
        .client-name {
            font-size: 14px;
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
        }
        .client-details {
            font-size: 11px;
            color: #666;
            line-height: 1.6;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 11px;
        }
        .detail-label {
            color: #666;
        }
        .detail-value {
            font-weight: bold;
            color: #333;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .items-table thead {
            background-color: #2c3e50;
            color: white;
        }
        .items-table th {
            padding: 12px 10px;
            text-align: left;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .items-table th:last-child {
            text-align: right;
        }
        .items-table td {
            padding: 12px 10px;
            border-bottom: 1px solid #eee;
            font-size: 11px;
        }
        .items-table td:last-child {
            text-align: right;
        }
        .items-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .summary-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
        }
        .summary-table {
            width: 300px;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 11px;
        }
        .summary-row.total {
            border-top: 2px solid #2c3e50;
            padding-top: 12px;
            margin-top: 8px;
            font-size: 14px;
            font-weight: bold;
            color: #2c3e50;
        }
        .notes-section {
            margin-bottom: 30px;
            padding: 15px;
            background-color: #f9f9f9;
            border-left: 3px solid #3498db;
        }
        .notes-title {
            font-size: 11px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
        }
        .notes-content {
            font-size: 10px;
            color: #666;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            font-size: 10px;
            color: #999;
        }
        .payment-info {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #ecf0f1;
        }
        .payment-title {
            font-size: 11px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        .payment-detail {
            font-size: 10px;
            color: #666;
            margin-bottom: 3px;
        }
        .qr-placeholder {
            width: 100px;
            height: 100px;
            background-color: #f0f0f0;
            border: 1px dashed #ccc;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 9px;
            color: #999;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="header">
            <div class="company-info">
                <div class="company-name">{{ $company['name'] }}</div>
                <div class="company-details">
                    {{ $company['address'] }}<br>
                    Email: {{ $company['email'] }}<br>
                    @if($company['phone'])
                        Phone: {{ $company['phone'] }}
                    @endif
                </div>
            </div>
            <div class="invoice-title">
                <h1>INVOICE</h1>
                <span class="status-badge">{{ $status['text'] }}</span>
            </div>
        </div>

        <!-- Invoice Meta -->
        <div class="invoice-meta">
            <div class="bill-to">
                <div class="section-title">Bill To</div>
                <div class="client-name">{{ $client->name }}</div>
                <div class="client-details">
                    @if($client->company_name)
                        {{ $client->company_name }}<br>
                    @endif
                    @if($client->address)
                        {{ $client->address }}<br>
                    @endif
                    Email: {{ $client->email }}<br>
                    @if($client->phone)
                        Phone: {{ $client->phone }}<br>
                    @endif
                    @if($client->tax_number)
                        Tax ID: {{ $client->tax_number }}
                    @endif
                </div>
            </div>
            <div class="invoice-details">
                <div class="section-title">Invoice Details</div>
                <div class="detail-row">
                    <span class="detail-label">Invoice Number:</span>
                    <span class="detail-value">#{{ $invoice->invoice_number }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Issue Date:</span>
                    <span class="detail-value">{{ $invoice->issue_date->format('M d, Y') }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Due Date:</span>
                    <span class="detail-value">{{ $invoice->due_date->format('M d, Y') }}</span>
                </div>
                @if($invoice->purchase_order)
                    <div class="detail-row">
                        <span class="detail-label">P.O. Number:</span>
                        <span class="detail-value">{{ $invoice->purchase_order }}</span>
                    </div>
                @endif
            </div>
        </div>

        <!-- Items Table -->
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 50%;">Description</th>
                    <th style="width: 15%;">Qty</th>
                    <th style="width: 20%;">Unit Price</th>
                    <th style="width: 15%;">Amount</th>
                </tr>
            </thead>
            <tbody>
                @forelse($lineItems as $item)
                    <tr>
                        <td>{{ $item->description }}</td>
                        <td>{{ $item->quantity }}</td>
                        <td>{{ $invoice->currency }} {{ number_format($item->unit_price, 2) }}</td>
                        <td>{{ $invoice->currency }} {{ number_format($item->total, 2) }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="4" style="text-align: center; color: #999;">
                            Professional Services - Invoice #{{ $invoice->invoice_number }}
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        <!-- Summary -->
        <div class="summary-section">
            <div class="summary-table">
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>{{ $invoice->currency }} {{ number_format($subtotal, 2) }}</span>
                </div>
                @if($tax > 0)
                    <div class="summary-row">
                        <span>Tax:</span>
                        <span>{{ $invoice->currency }} {{ number_format($tax, 2) }}</span>
                    </div>
                @endif
                @if($invoice->discount > 0)
                    <div class="summary-row">
                        <span>Discount:</span>
                        <span>-{{ $invoice->currency }} {{ number_format($invoice->discount, 2) }}</span>
                    </div>
                @endif
                <div class="summary-row total">
                    <span>Total:</span>
                    <span>{{ $invoice->currency }} {{ number_format($total, 2) }}</span>
                </div>
            </div>
        </div>

        <!-- Payment Info -->
        @if($invoice->payment_instructions)
            <div class="payment-info">
                <div class="payment-title">Payment Instructions</div>
                <div class="payment-detail">{!! nl2br(e($invoice->payment_instructions)) !!}</div>
            </div>
        @endif

        <!-- Notes -->
        @if($invoice->notes)
            <div class="notes-section">
                <div class="notes-title">Notes</div>
                <div class="notes-content">{{ $invoice->notes }}</div>
            </div>
        @endif

        <!-- Footer -->
        <div class="footer">
            <p><strong>Thank you for your business!</strong></p>
            <p style="margin-top: 10px;">
                If you have any questions about this invoice, please contact us at {{ $company['email'] }}
            </p>
            <p style="margin-top: 15px; font-size: 9px;">
                This invoice was generated by Invoice Recovery Agent<br>
                © {{ date('Y') }} {{ $company['name'] }}. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
