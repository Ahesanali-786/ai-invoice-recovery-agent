# AI Invoice Recovery Agent

A complete SaaS solution for SMEs to automate invoice payment collection using AI-powered reminders via Email and WhatsApp.

## Features

- **AI Invoice Parsing**: Upload PDF/images and automatically extract invoice data using OpenAI GPT-4 Vision
- **Automated Reminders**: Schedule polite payment reminders via Email and WhatsApp
- **Escalation System**: Automatic escalation from gentle to urgent reminders
- **Dashboard Analytics**: Track revenue, outstanding payments, and overdue invoices
- **Client Management**: Organize customers and their payment history
- **Google OAuth**: Secure authentication with Google login
- **WhatsApp Integration**: Send reminders directly via Meta WhatsApp Business API
- **Docker Ready**: Complete containerization for easy deployment

## Tech Stack

### Backend
- **Laravel 12** - PHP Framework
- **MySQL 8** - Database
- **Redis** - Queue & Cache
- **Laravel Sanctum** - API Authentication
- **Laravel Socialite** - Google OAuth
- **OpenAI API** - Invoice parsing & message generation
- **Meta WhatsApp Cloud API** - WhatsApp messaging

### Frontend
- **React 18** - UI Library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **React Query** - Data fetching
- **Recharts** - Analytics charts
- **Heroicons** - Icons

## Quick Start with Docker

1. **Clone and navigate to project:**
```bash
cd "AI Recovery Agent"
```

2. **Start all services:**
```bash
docker-compose up -d
```

3. **Install backend dependencies:**
```bash
docker-compose exec app composer install
```

4. **Copy environment file:**
```bash
cp backend/.env.example backend/.env
docker-compose exec app php artisan key:generate
```

5. **Run migrations:**
```bash
docker-compose exec app php artisan migrate
```

6. **Install frontend dependencies:**
```bash
cd frontend && npm install && npm run dev
```

7. **Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api
- MySQL: localhost:3306

## Configuration

### Required Environment Variables

Create `backend/.env` file with:

```env
# Database
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=invoice_recovery
DB_USERNAME=laravel
DB_PASSWORD=secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# WhatsApp Cloud API
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_verify_token
```

### WhatsApp Setup

1. Create a Meta Developer account
2. Set up WhatsApp Business API
3. Configure webhook URL: `https://your-domain.com/api/webhooks/whatsapp`
4. Add phone number and get access token

## Project Structure

```
AI Recovery Agent/
├── backend/                 # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/API/
│   │   ├── Models/
│   │   ├── Services/
│   │   └── Jobs/
│   ├── database/migrations/
│   ├── routes/api.php
│   └── config/
├── frontend/               # React App
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── hooks/
│   └── package.json
├── docker/                 # Docker configs
│   ├── php/Dockerfile
│   └── nginx/default.conf
└── docker-compose.yml
```

## API Endpoints

### Authentication
- `GET /api/auth/google` - Google OAuth redirect
- `GET /api/auth/google/callback` - OAuth callback
- `POST /api/logout` - Logout
- `GET /api/user` - Get current user

### Clients
- `GET /api/clients` - List clients
- `POST /api/clients` - Create client
- `GET /api/clients/{id}` - Get client details
- `PUT /api/clients/{id}` - Update client
- `DELETE /api/clients/{id}` - Delete client

### Invoices
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice (supports file upload)
- `GET /api/invoices/{id}` - Get invoice details
- `PUT /api/invoices/{id}` - Update invoice
- `DELETE /api/invoices/{id}` - Delete invoice
- `POST /api/invoices/{id}/mark-paid` - Mark as paid
- `POST /api/invoices/{id}/reminders` - Send reminder

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics

## How It Works

1. **Upload Invoice**: User uploads PDF/image of invoice
2. **AI Parsing**: OpenAI extracts invoice data (amount, due date, client info)
3. **Create Record**: Invoice is saved with extracted data
4. **Track Due Dates**: System monitors due dates
5. **Send Reminders**: 
   - Gentle reminder 3 days before due date
   - Standard reminder on due date
   - Urgent reminder 3 days after due date
   - Final notice 7 days after due date
6. **Escalation**: Reminders get progressively more assertive
7. **Payment Confirmation**: Client replies, invoice marked as paid

## License

MIT License

## Support

For issues and feature requests, please create an issue in the repository.
