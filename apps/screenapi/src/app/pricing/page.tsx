'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [showPromoInput, setShowPromoInput] = useState(false);

  const handleCheckout = async (plan: 'PRO' | 'ENTERPRISE') => {
    if (!session) {
      router.push('/auth/signin?callbackUrl=/pricing');
      return;
    }

    setLoading(plan);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          promoCode: promoCode || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to create checkout session');
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <nav className="border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-white">
              ScreenAPI
            </Link>
            <div className="flex items-center space-x-6">
              <Link href="/docs" className="text-gray-300 hover:text-white transition">
                Docs
              </Link>
              {session ? (
                <Link
                  href="/dashboard"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/auth/signin"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-purple-200 max-w-2xl mx-auto">
            Choose the plan that fits your needs. Upgrade, downgrade, or cancel anytime.
          </p>

          {/* Promo Code Toggle */}
          <div className="mt-8">
            {!showPromoInput ? (
              <button
                onClick={() => setShowPromoInput(true)}
                className="text-purple-400 hover:text-purple-300 text-sm font-semibold underline"
              >
                Have a promo code?
              </button>
            ) : (
              <div className="max-w-md mx-auto">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter promo code"
                    className="flex-1 px-4 py-2 bg-slate-800/50 border border-purple-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={() => setShowPromoInput(false)}
                    className="px-4 py-2 text-purple-300 hover:text-purple-200"
                  >
                    Cancel
                  </button>
                </div>
                {promoCode && (
                  <p className="mt-2 text-sm text-purple-300">
                    Promo code "{promoCode}" will be applied at checkout
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Free Plan */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
              <div className="flex items-baseline mb-4">
                <span className="text-5xl font-bold text-white">$0</span>
                <span className="text-purple-200 ml-2">/month</span>
              </div>
              <p className="text-purple-200">Perfect for testing and small projects</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-purple-200">100 screenshots/day</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-purple-200">50 scraping requests/day</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-purple-200">All device presets</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-purple-200">10 requests/minute</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-purple-200">Community support</span>
              </li>
            </ul>

            <Link
              href={session ? "/dashboard" : "/auth/signup"}
              className="block w-full px-6 py-3 bg-white/10 text-white rounded-xl font-semibold text-center hover:bg-white/20 transition-all"
            >
              {session ? 'Current Plan' : 'Get Started'}
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-lg rounded-2xl p-8 border-2 border-purple-500 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                MOST POPULAR
              </span>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <div className="flex items-baseline mb-4">
                <span className="text-5xl font-bold text-white">$49</span>
                <span className="text-purple-200 ml-2">/month</span>
              </div>
              <p className="text-purple-200">For growing teams and businesses</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white">10,000 screenshots/day</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white">5,000 scraping requests/day</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white">All device presets</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white">100 requests/minute</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white">Priority email support</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white">99.9% uptime SLA</span>
              </li>
            </ul>

            <button
              onClick={() => handleCheckout('PRO')}
              disabled={loading !== null}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading === 'PRO' ? 'Processing...' : 'Upgrade to Pro'}
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
              <div className="flex items-baseline mb-4">
                <span className="text-5xl font-bold text-white">$299</span>
                <span className="text-purple-200 ml-2">/month</span>
              </div>
              <p className="text-purple-200">For large-scale applications</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-purple-200">Unlimited screenshots</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-purple-200">Unlimited scraping</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-purple-200">All device presets</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-purple-200">Custom rate limits</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-purple-200">24/7 priority support</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-purple-200">Dedicated account manager</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-purple-200">Custom integrations</span>
              </li>
            </ul>

            <button
              onClick={() => handleCheckout('ENTERPRISE')}
              disabled={loading !== null}
              className="w-full px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading === 'ENTERPRISE' ? 'Processing...' : 'Upgrade to Enterprise'}
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-2">
                Can I change plans later?
              </h3>
              <p className="text-purple-200">
                Yes! You can upgrade, downgrade, or cancel your subscription at any time from your dashboard.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-2">
                What happens if I exceed my limit?
              </h3>
              <p className="text-purple-200">
                On the Free plan, requests will be rate limited. On paid plans, you'll never lose access – we'll contact you about upgrading.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-purple-200">
                Yes, we offer a 14-day money-back guarantee on all paid plans. No questions asked.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-2">
                How do promo codes work?
              </h3>
              <p className="text-purple-200">
                Enter your promo code above before checking out. Discounts are applied automatically at payment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
