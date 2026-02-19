<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ClientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $clients = $request->user()
            ->clients()
            ->withCount(['invoices'])
            ->withSum('invoices as outstanding_amount', 'amount')
            ->orderBy('name')
            ->paginate(20);

        return response()->json($clients);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:clients,email',
            'phone' => 'nullable|string|max:20',
            'whatsapp_number' => 'nullable|string|max:20',
            'company' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'tax_id' => 'nullable|string|max:50',
            'preferred_contact_method' => 'nullable|in:email,whatsapp,sms',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $client = $request->user()->clients()->create($validator->validated());

        return response()->json($client, 201);
    }

    public function show(Request $request, Client $client): JsonResponse
    {
        $this->authorize('view', $client);

        $client->load(['invoices' => function ($query) {
            $query->orderBy('due_date', 'desc');
        }]);

        return response()->json($client);
    }

    public function update(Request $request, Client $client): JsonResponse
    {
        $this->authorize('update', $client);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:clients,email,' . $client->id,
            'phone' => 'nullable|string|max:20',
            'whatsapp_number' => 'nullable|string|max:20',
            'company' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'tax_id' => 'nullable|string|max:50',
            'preferred_contact_method' => 'nullable|in:email,whatsapp,sms',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $client->update($validator->validated());

        return response()->json($client);
    }

    public function destroy(Request $request, Client $client): JsonResponse
    {
        $this->authorize('delete', $client);

        $client->delete();

        return response()->json(['message' => 'Client deleted successfully']);
    }
}
