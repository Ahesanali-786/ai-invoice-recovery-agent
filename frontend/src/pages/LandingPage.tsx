import { Link } from 'react-router-dom'
import {
  DocumentTextIcon,
  BellIcon,
  ChartBarIcon,
  SparklesIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  ClockIcon,
  UserGroupIcon,
  EnvelopeIcon,
  StarIcon,
  ChevronDownIcon,
  BoltIcon,
  LockClosedIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline'
import { useState } from 'react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-lg shadow-lg">
                <DocumentTextIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                Invoice Recovery
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Testimonials</a>
              <a href="#faq" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">FAQ</a>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-gray-700 hover:text-blue-600 font-medium px-4 py-2 transition-colors hidden sm:block"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-medium px-5 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                Get Started Free
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <SparklesIcon className="h-4 w-4" />
              AI-Powered Invoice Management
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-gray-900 leading-tight">
              Get Paid Faster with{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                Smart Automation
              </span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Automate invoice recovery with AI-driven reminders, real-time analytics,
              and seamless client communication. Join 10,000+ businesses saving 20+ hours monthly.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/register"
                className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
              >
                Start Free Trial
                <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="bg-white hover:bg-gray-50 text-gray-900 font-semibold px-8 py-4 rounded-xl border-2 border-gray-300 transition-all hover:border-gray-400"
              >
                Sign In to Dashboard
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-gray-500 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Logos Section */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm font-medium uppercase tracking-wider mb-8">
            Trusted by leading companies worldwide
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <TrustLogo name="Stripe" />
            <TrustLogo name="Shopify" />
            <TrustLogo name="Slack" />
            <TrustLogo name="Notion" />
            <TrustLogo name="Figma" />
            <TrustLogo name="Vercel" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <StatCard number="10,000+" label="Active Businesses" />
            <StatCard number="$50M+" label="Invoices Processed" />
            <StatCard number="85%" label="Faster Payments" />
            <StatCard number="4.9/5" label="Customer Rating" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Invoices
            </h2>
            <p className="text-lg text-gray-600">
              Powerful features designed to streamline your invoice workflow and improve cash flow
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={SparklesIcon}
              title="AI-Powered Insights"
              description="Get intelligent recommendations for optimal reminder timing and payment recovery strategies based on client behavior."
              color="purple"
            />
            <FeatureCard
              icon={BellIcon}
              title="Multi-Channel Reminders"
              description="Send automated reminders via Email, WhatsApp, and SMS with personalized templates and smart scheduling."
              color="blue"
            />
            <FeatureCard
              icon={ChartBarIcon}
              title="Advanced Analytics"
              description="Track revenue, outstanding payments, payment trends, and client behavior with comprehensive dashboards."
              color="green"
            />
            <FeatureCard
              icon={UserGroupIcon}
              title="Client Management"
              description="Centralized client database with payment history, communication logs, and behavior analysis."
              color="orange"
            />
            <FeatureCard
              icon={BoltIcon}
              title="Auto-Generated Invoices"
              description="Create professional invoices instantly with auto-generated numbers, customizable templates, and PDF generation."
              color="yellow"
            />
            <FeatureCard
              icon={GlobeAltIcon}
              title="Multi-Currency Support"
              description="Accept payments in 150+ currencies with real-time exchange rates and automated conversion."
              color="indigo"
            />
            <FeatureCard
              icon={DevicePhoneMobileIcon}
              title="Mobile Responsive"
              description="Access your dashboard, create invoices, and track payments from any device, anywhere."
              color="pink"
            />
            <FeatureCard
              icon={LockClosedIcon}
              title="Bank-Level Security"
              description="256-bit SSL encryption, GDPR compliance, and secure data storage with automatic backups."
              color="teal"
            />
            <FeatureCard
              icon={ClockIcon}
              title="24/7 Automation"
              description="Your invoice recovery runs around the clock, sending reminders even while you sleep."
              color="red"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple 3-Step Process
            </h2>
            <p className="text-lg text-gray-600">
              Get started in minutes and start recovering payments faster
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-blue-200 to-indigo-200 -translate-y-1/2" />
            <StepCard
              number={1}
              title="Upload & Create"
              description="Upload existing invoices or create new ones with auto-generated numbers and client details. Our AI can even extract data from PDFs."
            />
            <StepCard
              number={2}
              title="Configure Automation"
              description="Set up smart reminder schedules. Choose channels (Email/WhatsApp), timing, and personalized message templates."
            />
            <StepCard
              number={3}
              title="Watch Payments Roll In"
              description="Sit back as automated reminders recover payments. Track everything in real-time and receive instant notifications."
            />
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Seamless Integrations
            </h2>
            <p className="text-lg text-gray-600">
              Connect with your favorite tools and streamline your workflow
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            <IntegrationCard name="QuickBooks" category="Accounting" />
            <IntegrationCard name="Xero" category="Accounting" />
            <IntegrationCard name="Stripe" category="Payments" />
            <IntegrationCard name="PayPal" category="Payments" />
            <IntegrationCard name="Slack" category="Communication" />
            <IntegrationCard name="Gmail" category="Email" />
            <IntegrationCard name="WhatsApp" category="Messaging" />
            <IntegrationCard name="Zapier" category="Automation" />
            <IntegrationCard name="HubSpot" category="CRM" />
            <IntegrationCard name="Salesforce" category="CRM" />
            <IntegrationCard name="Google Drive" category="Storage" />
            <IntegrationCard name="Dropbox" category="Storage" />
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Why 10,000+ Businesses Choose Us
            </h2>
            <p className="text-gray-400 text-lg">
              We are committed to helping you get paid faster with industry-leading features
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <WhyChooseCard
              icon={CheckCircleIcon}
              title="98% Success Rate"
              description="Our AI-optimized reminders achieve industry-leading payment recovery rates"
            />
            <WhyChooseCard
              icon={ClockIcon}
              title="Save 20+ Hours/Week"
              description="Automate manual follow-ups and focus on growing your business"
            />
            <WhyChooseCard
              icon={ShieldCheckIcon}
              title="Bank-Grade Security"
              description="256-bit encryption, SOC 2 certified, GDPR compliant infrastructure"
            />
            <WhyChooseCard
              icon={DevicePhoneMobileIcon}
              title="24/7 Support"
              description="Our dedicated team is available round the clock to assist you"
            />
          </div>

          {/* Security Badges */}
          <div className="mt-16 pt-16 border-t border-gray-700">
            <p className="text-center text-gray-500 text-sm font-medium uppercase tracking-wider mb-8">
              Enterprise-grade security & compliance
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8">
              <SecurityBadge name="SOC 2" description="Type II Certified" />
              <SecurityBadge name="GDPR" description="Compliant" />
              <SecurityBadge name="PCI DSS" description="Level 1" />
              <SecurityBadge name="ISO 27001" description="Certified" />
              <SecurityBadge name="SSL" description="256-bit" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Loved by Businesses Worldwide
            </h2>
            <p className="text-blue-100 text-lg">
              See what our customers have to say about Invoice Recovery
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard
              quote="Invoice Recovery reduced our outstanding payments by 70% in just 2 months. The AI reminders are incredibly effective."
              author="Ahesanali Ali Kadiwala"
              role="CFO, TechStart Inc."
              rating={5}
            />
            <TestimonialCard
              quote="We used to spend 10+ hours weekly chasing payments. Now it's fully automated. Best investment for our agency."
              author="Ahesanali Ali Kadiwala"
              role="Director, Creative Agency"
              rating={5}
            />
            <TestimonialCard
              quote="The analytics dashboard gives us insights we never had before. We can predict cash flow with 95% accuracy now."
              author="Ahesanali Ali Kadiwala"
              role="Finance Manager, Retail Plus"
              rating={5}
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600">
              Start free, upgrade when you're ready. No hidden fees.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <PricingCard
              name="Starter"
              price="Free"
              description="Perfect for freelancers and small businesses"
              features={[
                'Up to 10 invoices/month',
                'Email reminders',
                'Basic analytics',
                '1 team member',
                'Community support'
              ]}
              cta="Get Started Free"
              to="/register"
              popular={false}
            />
            <PricingCard
              name="Professional"
              price="$29"
              period="/month"
              description="Best for growing businesses"
              features={[
                'Unlimited invoices',
                'Email + WhatsApp reminders',
                'Advanced analytics & AI insights',
                '5 team members',
                'Priority support',
                'Custom branding',
                'API access'
              ]}
              cta="Start Free Trial"
              to="/register"
              popular={true}
            />
            <PricingCard
              name="Enterprise"
              price="$99"
              period="/month"
              description="For large teams and agencies"
              features={[
                'Everything in Pro',
                'Unlimited team members',
                'Dedicated account manager',
                'Custom integrations',
                'SLA guarantee',
                'White-label solution',
                'Advanced security controls'
              ]}
              cta="Contact Sales"
              to="/register"
              popular={false}
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to know about Invoice Recovery
            </p>
          </div>
          <div className="space-y-4">
            <FAQItem
              question="How does the 14-day free trial work?"
              answer="Start with full access to all Professional features. No credit card required. At the end of 14 days, choose to upgrade or continue with our free Starter plan."
            />
            <FAQItem
              question="Can I import existing invoices?"
              answer="Yes! Import invoices from Excel, CSV, or connect with QuickBooks, Xero, and other accounting software. Our AI can even extract data from PDF invoices."
            />
            <FAQItem
              question="How do automated reminders work?"
              answer="Set up custom reminder schedules (e.g., 7 days before due, on due date, 3 days after). Choose Email, WhatsApp, or both. Personalize templates with client names and dynamic fields."
            />
            <FAQItem
              question="Is my data secure?"
              answer="Absolutely. We use 256-bit SSL encryption, store data in SOC 2 certified data centers, and are GDPR compliant. Your financial data is never shared with third parties."
            />
            <FAQItem
              question="What currencies do you support?"
              answer="We support 150+ currencies with real-time exchange rates. Create invoices in any currency and receive payments through integrated payment gateways."
            />
            <FAQItem
              question="Can I cancel anytime?"
              answer="Yes! No contracts, no commitments. Cancel your subscription anytime from your account settings. Your data remains accessible even after cancellation."
            />
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <EnvelopeIcon className="h-12 w-12 text-white/80 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Stay Updated with Invoice Tips
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Join 25,000+ business owners receiving weekly insights on improving cash flow and automating invoice recovery.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-1 px-6 py-4 rounded-xl border-0 focus:ring-2 focus:ring-white/50 text-gray-900"
            />
            <button
              type="submit"
              className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 py-4 rounded-xl transition-colors whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
          <p className="text-blue-200 text-sm mt-4">
            No spam, unsubscribe anytime. Read our Privacy Policy.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Invoice Process?
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            Join 10,000+ businesses getting paid faster. Start your free trial today —
            no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              Create Free Account
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
            <Link
              to="/login"
              className="bg-gray-800 hover:bg-gray-700 text-white font-semibold px-8 py-4 rounded-xl border-2 border-gray-600 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <DocumentTextIcon className="h-8 w-8 text-blue-500" />
                <span className="text-2xl font-bold text-white">Invoice Recovery</span>
              </div>
              <p className="text-gray-500 mb-4 max-w-sm">
                AI-powered invoice management platform helping businesses get paid faster through smart automation.
              </p>
              <div className="flex gap-4">
                <Link to="/login" className="text-gray-400 hover:text-white transition-colors">Login</Link>
                <Link to="/register" className="text-gray-400 hover:text-white transition-colors">Register</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">© 2026 Invoice Recovery. All rights reserved.</p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="p-6">
      <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
        {number}
      </div>
      <div className="text-gray-600 mt-1 font-medium">{label}</div>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description, color }: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  color: string
}) {
  const colorClasses: Record<string, string> = {
    purple: 'bg-purple-100 text-purple-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    teal: 'bg-teal-100 text-teal-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    pink: 'bg-pink-100 text-pink-600',
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group">
      <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  )
}

function StepCard({ number, title, description }: {
  number: number
  title: string
  description: string
}) {
  return (
    <div className="relative bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center z-10">
      <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
        {number}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}

function TestimonialCard({ quote, author, role, rating }: {
  quote: string
  author: string
  role: string
  rating: number
}) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
      <div className="flex gap-1 mb-4">
        {[...Array(rating)].map((_, i) => (
          <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
        ))}
      </div>
      <p className="text-white text-lg mb-6 leading-relaxed">"{quote}"</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
          {author.charAt(0)}
        </div>
        <div>
          <p className="text-white font-semibold">{author}</p>
          <p className="text-blue-200 text-sm">{role}</p>
        </div>
      </div>
    </div>
  )
}

function PricingCard({ name, price, period = '', description, features, cta, to, popular }: {
  name: string
  price: string
  period?: string
  description: string
  features: string[]
  cta: string
  to: string
  popular: boolean
}) {
  return (
    <div className={`rounded-2xl p-6 ${popular ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl scale-105' : 'bg-white border-2 border-gray-200'} relative`}>
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
          Most Popular
        </div>
      )}
      <div className="mb-6">
        <h3 className={`text-xl font-bold ${popular ? 'text-white' : 'text-gray-900'}`}>{name}</h3>
        <p className={`text-sm mt-1 ${popular ? 'text-blue-100' : 'text-gray-600'}`}>{description}</p>
      </div>
      <div className="mb-6">
        <span className={`text-4xl font-bold ${popular ? 'text-white' : 'text-gray-900'}`}>{price}</span>
        {period && <span className={popular ? 'text-blue-200' : 'text-gray-600'}>{period}</span>}
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3">
            <CheckCircleIcon className={`h-5 w-5 ${popular ? 'text-blue-200' : 'text-green-500'}`} />
            <span className={popular ? 'text-blue-50' : 'text-gray-700'}>{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        to={to}
        className={`block text-center font-semibold py-3 px-6 rounded-xl transition-all ${popular
          ? 'bg-white text-blue-600 hover:bg-blue-50 shadow-lg'
          : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:shadow-lg'
          }`}
      >
        {cta}
      </Link>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900">{question}</span>
        <ChevronDownIcon className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-5 pb-5 bg-gray-50">
          <p className="text-gray-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  )
}

function TrustLogo({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 text-xl font-bold text-gray-700 hover:text-gray-900 transition-colors cursor-pointer">
      <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center text-white text-sm">
        {name.charAt(0)}
      </div>
      {name}
    </div>
  )
}

function IntegrationCard({ name, category }: { name: string; category: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 text-center hover:shadow-md transition-all hover:bg-white border border-transparent hover:border-gray-200 group">
      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform">
        {name.charAt(0)}
      </div>
      <p className="font-semibold text-gray-900 text-sm">{name}</p>
      <p className="text-xs text-gray-500">{category}</p>
    </div>
  )
}

function WhyChooseCard({ icon: Icon, title, description }: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="text-center p-6">
      <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-2xl flex items-center justify-center">
        <Icon className="h-8 w-8 text-blue-400" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  )
}

function SecurityBadge({ name, description }: { name: string; description: string }) {
  return (
    <div className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-xl border border-white/10">
      <ShieldCheckIcon className="h-6 w-6 text-green-400" />
      <div>
        <p className="text-white font-semibold text-sm">{name}</p>
        <p className="text-gray-400 text-xs">{description}</p>
      </div>
    </div>
  )
}
