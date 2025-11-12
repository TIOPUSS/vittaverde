# Overview

VittaVerde is a Brazilian platform dedicated to facilitating legal access to CBD medical products. It manages the entire patient journey from telemedicine consultations and ANVISA authorization to import intermediation of cannabis-based products, ensuring compliance with RDC 660/2022. The platform serves patients, consultants, doctors, and administrators through web and PWA interfaces. Its core purpose is to lead the Brazilian medical cannabis market by providing empathetic, health-focused, and scientifically-backed information on medicinal cannabis. It exclusively integrates with YAMPI for all e-commerce operations.

# User Preferences

Preferred communication style: Simple, everyday language.
Key requirements:
- Always emphasize "intermediação da importação" (import intermediation) in all contexts
- All buttons must be functional with real navigation, not just visual
- Platform must work as both web application and mobile app (PWA)
- Tracking system with codes for ANVISA authorization monitoring
- Hierarchical user system with administration capabilities
- All university content MUST come from Content Management system (database), not hardcoded
- **CRITICAL RULE**: Patient intake form (/patologias) is shown ONLY ONCE. After patient completes it (has pathologies in database), login ALWAYS redirects to /bem-estar dashboard, NEVER back to the form

# System Architecture

## Frontend
- **Framework**: React with TypeScript (Vite)
- **Routing**: Wouter
- **State Management**: TanStack Query (React Query)
- **UI Framework**: Shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS (VittaVerde branding, glassmorphism, mobile-first, responsive, modern gradient backgrounds, card-based sections, simplified hero sections on mobile)
- **Form Handling**: React Hook Form with Zod validation
- **Language**: 100% Portuguese only

## Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL (Neon serverless)
- **API Design**: RESTful APIs
- **Authentication**: JWT-based SSO for partner integrations

## Key Features & Business Logic
- **User Management**: Role-based (patient, consultant, doctor, admin) with intelligent login redirects. Includes external vendor/affiliate system.
- **Patient Flow**: Tracks consultation to delivery, ANVISA authorization, and order details, with vendor attribution.
- **Product Catalog**: CBD products with categories, stock, THC, Supplier, Brand, synchronized with YAMPI.
- **Consultation System**: Telemedicine integration, prescription management.
- **CRM System**: Lead management with kanban stages, inline editing, vendor ranking, real-time data, drag & drop, lead history, prescription document viewer, dynamic kanban columns.
- **YAMPI E-commerce Integration**: Complete checkout solution with product sync, cart, dynamic checkout creation, webhook processing, and transaction tracking.
- **Educational Content**: Articles, videos, courses, news, and professional course modules.
- **ANVISA Integration**: Automated regulatory authorization assistance, compliance with RDC 660/2022 and CFM Resolution 2314/2022.
- **Authentication & Authorization**: Role-based access control, secure session management, HIPAA-like data privacy, 6-digit email verification.
- **Partner SSO**: JWT-based automatic login to partner doctor platforms with configurable parameters and audit logging.
- **Flexible Payment Gateway System**: Supports multiple configurable gateways (though YAMPI is currently exclusive).
- **Professional Tools**: Dosage Calculator, Knowledge Base.
- **Order Management System**: Admin order management with real-time metrics, tracking for transport, ANVISA, and import.
- **Document Approval System**: Admin approval for prescription and ANVISA documents.
- **Email Configuration**: Manual Microsoft 365 setup via `/admin/email-config` using database storage.
- **SMS Verification**: Multi-provider support (Twilio, Vonage, AWS SNS, Generic API) with visual configuration.
- **WhatsApp Business Integration**: Meta API + N8N workflow integration configured via `/admin/whatsapp-config`.
- **N8N API**: Full bidirectional data access for N8N workflows.
- **International Phone Validation**: Utilizes `react-phone-number-input`.
- **External Vendor/Affiliate System**: Automatic link generation, click/registration/purchase tracking, commission calculation, and CRM integration.
- **Commission System**: Differentiates between internal (Comercial) and external (Vendedor Externo) sales roles.
- **Partner Webhook System**: Secure integration for receiving consultation data and prescriptions from external doctor platforms via HMAC SHA-256 signed webhooks. Automatically processes data, uploads prescriptions to object storage, and enables products for patients upon admin approval.

# External Dependencies

- **Database**: Neon Serverless PostgreSQL
- **UI Components**: Radix UI
- **Validation**: Zod, react-phone-number-input
- **Payment Gateway**: YAMPI (exclusive integration for all e-commerce operations)
- **Object Storage**: For all file uploads (e.g., prescriptions)
- **Email Service**: Microsoft 365 (manual configuration)
- **SMS Services**: Twilio, Vonage, AWS SNS, Generic REST API
- **WhatsApp**: Meta Business API
- **Workflow Automation**: N8N