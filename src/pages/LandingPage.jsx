import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Film, Wand2, Mic, Image as ImageIcon, Video, Sparkles,
    Check, X, ChevronRight, Play, Star
} from "lucide-react";
import { motion } from "framer-motion";
import { User } from '@/entities/User';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

const FEATURES = [
    {
        icon: Wand2,
        title: "AI-Powered Script Analysis",
        description: "Advanced AI breaks down your script into professional storyboards with scene descriptions, timing, and visual details.",
        color: "from-purple-400 to-pink-500"
    },
    {
        icon: ImageIcon,
        title: "Multi-Model Image Generation",
        description: "Choose from multiple AI models (Stable Diffusion, SDXL, Flux) to generate stunning visuals that match your vision.",
        color: "from-blue-400 to-cyan-500"
    },
    {
        icon: Mic,
        title: "Professional Voiceovers",
        description: "Generate natural-sounding voiceovers in 15+ languages with premium AI voices or browser TTS.",
        color: "from-amber-400 to-orange-500"
    },
    {
        icon: Video,
        title: "Automated Video Assembly",
        description: "Seamlessly combine images, voiceovers, effects, and music into polished videos ready for export.",
        color: "from-green-400 to-emerald-500"
    }
];

const PRICING_TIERS = [
    {
        name: "Free",
        price: "$0",
        period: "forever",
        description: "Perfect for trying out the platform",
        features: [
            { text: "3 videos per day", included: true },
            { text: "Browser text-to-speech", included: true },
            { text: "Basic AI models", included: true },
            { text: "720p export", included: true },
            { text: "Watermark on videos", included: true },
            { text: "Premium AI models", included: false },
            { text: "ElevenLabs voices", included: false },
            { text: "1080p export", included: false },
            { text: "Priority processing", included: false }
        ],
        cta: "Start Free",
        popular: false,
        planType: "free"
    },
    {
        name: "Pro",
        price: "$29",
        period: "per month",
        description: "For creators who need quality",
        features: [
            { text: "50 videos per day", included: true },
            { text: "Premium AI models", included: true },
            { text: "ElevenLabs voices", included: true },
            { text: "1080p export", included: true },
            { text: "No watermark", included: true },
            { text: "Custom model selection", included: true },
            { text: "Manual review workflow", included: true },
            { text: "Priority support", included: true },
            { text: "Advanced editing", included: true }
        ],
        cta: "Start Pro Trial",
        popular: true,
        planType: "pro",
        priceId: "price_pro_monthly" // Replace with actual Stripe price ID
    },
    {
        name: "Enterprise",
        price: "$99",
        period: "per month",
        description: "For teams and agencies",
        features: [
            { text: "Unlimited videos", included: true },
            { text: "All premium models", included: true },
            { text: "White-label option", included: true },
            { text: "4K export", included: true },
            { text: "API access", included: true },
            { text: "Custom model training", included: true },
            { text: "Dedicated support", included: true },
            { text: "Team collaboration", included: true },
            { text: "Custom integrations", included: true }
        ],
        cta: "Contact Sales",
        popular: false,
        planType: "enterprise",
        priceId: "price_enterprise_monthly" // Replace with actual Stripe price ID
    }
];

const HOW_IT_WORKS = [
    {
        step: 1,
        title: "Write or Upload Script",
        description: "Type your script or upload a text file. You can even use voice input!",
        icon: Film
    },
    {
        step: 2,
        title: "AI Creates Storyboard",
        description: "Our AI analyzes your script and creates a detailed storyboard with scenes and timing.",
        icon: Wand2
    },
    {
        step: 3,
        title: "Generate Visuals & Audio",
        description: "AI generates images and voiceovers for each scene. Review and edit as needed.",
        icon: Sparkles
    },
    {
        step: 4,
        title: "Export Your Video",
        description: "Download your professional video ready for YouTube, social media, or presentations.",
        icon: Video
    }
];

const FAQS = [
    {
        question: "What AI models are available?",
        answer: "Free users get access to basic models. Pro users can choose from GPT-4o, Claude, Gemini for scripts; Stable Diffusion XL, Flux for images; and ElevenLabs for premium voices."
    },
    {
        question: "Can I edit the AI-generated content?",
        answer: "Absolutely! You have full control to edit storyboards, regenerate specific images, adjust dialogues, and fine-tune every aspect before final video generation."
    },
    {
        question: "What languages are supported?",
        answer: "We support 15+ languages including English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese, Hindi, Tamil, Arabic, Turkish, and Dutch."
    },
    {
        question: "Can I cancel my subscription anytime?",
        answer: "Yes! You can cancel your subscription at any time. You'll retain access until the end of your billing period."
    },
    {
        question: "What video formats can I export?",
        answer: "Free users can export in WebM format at 720p. Pro and Enterprise users get MP4/WebM at 1080p and 4K respectively, with no watermarks."
    }
];

export default function LandingPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
            const currentUser = await User.me();
            setUser(currentUser);
            // If user is already logged in, redirect to app
            navigate(createPageUrl('Home'));
        } catch (err) {
            // User not logged in, stay on landing page
            setLoading(false);
        }
    };

    const handleGetStarted = async () => {
        if (user) {
            navigate(createPageUrl('Home'));
        } else {
            await User.login();
        }
    };

    const handleUpgrade = async (tier) => {
        if (!user) {
            await User.login();
            return;
        }

        if (tier.planType === 'free') {
            navigate(createPageUrl('Home'));
        } else if (tier.planType === 'enterprise') {
            // Open contact form or email
            window.location.href = 'mailto:sales@yourdomain.com?subject=Enterprise Plan Inquiry';
        } else {
            // Redirect to Stripe checkout
            navigate(createPageUrl('Home') + '?upgrade=' + tier.planType);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
            {/* Hero Section */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40" />

                <div className="relative container mx-auto px-4 py-20 lg:py-32">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center max-w-4xl mx-auto"
                    >
                        <Badge className="mb-6 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-2 text-sm">
                            <Sparkles className="w-4 h-4 mr-2 inline" />
                            Powered by Advanced AI Models
                        </Badge>

                        <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight">
                            Transform Scripts into
                            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent"> Professional Videos</span>
                        </h1>

                        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                            AI-powered video creation with advanced models for script analysis, image generation, and natural voiceovers in 15+ languages.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Button
                                onClick={handleGetStarted}
                                size="lg"
                                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-lg px-8 py-6"
                            >
                                <Play className="w-5 h-5 mr-2" />
                                Start Creating Free
                                <ChevronRight className="w-5 h-5 ml-2" />
                            </Button>

                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })}
                                className="text-lg px-8 py-6"
                            >
                                View Pricing
                            </Button>
                        </div>

                        <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                                <Check className="w-5 h-5 text-green-500" />
                                No credit card required
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="w-5 h-5 text-green-500" />
                                3 free videos daily
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="w-5 h-5 text-green-500" />
                                Upgrade anytime
                            </div>
                        </div>
                    </motion.div>

                    {/* Demo Video Placeholder */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mt-16 max-w-5xl mx-auto"
                    >
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                            <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                                <div className="text-center text-white">
                                    <Film className="w-20 h-20 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg opacity-75">Demo Video Coming Soon</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-slate-900 mb-4">
                            Everything You Need to Create Amazing Videos
                        </h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                            Powered by the latest AI models from OpenAI, Google, Anthropic, and more
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {FEATURES.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                            >
                                <Card className="h-full hover:shadow-xl transition-shadow duration-300 border-2">
                                    <CardHeader>
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                                            <feature.icon className="w-6 h-6 text-white" />
                                        </div>
                                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-slate-600">{feature.description}</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 bg-slate-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-slate-900 mb-4">
                            How It Works
                        </h2>
                        <p className="text-xl text-slate-600">
                            From script to video in 4 simple steps
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        {HOW_IT_WORKS.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="flex gap-6 mb-12 last:mb-0"
                            >
                                <div className="flex-shrink-0">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                        {item.step}
                                    </div>
                                </div>
                                <div className="flex-1 pt-2">
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                                        <item.icon className="w-6 h-6 text-amber-500" />
                                        {item.title}
                                    </h3>
                                    <p className="text-lg text-slate-600">{item.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-slate-900 mb-4">
                            Choose Your Plan
                        </h2>
                        <p className="text-xl text-slate-600">
                            Start free, upgrade when you need more power
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {PRICING_TIERS.map((tier, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="relative"
                            >
                                {tier.popular && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                        <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-1">
                                            <Star className="w-3 h-3 mr-1 inline" />
                                            Most Popular
                                        </Badge>
                                    </div>
                                )}

                                <Card className={`h-full ${tier.popular ? 'border-amber-400 border-2 shadow-xl' : 'border-2'}`}>
                                    <CardHeader>
                                        <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                                        <div className="mt-4">
                                            <span className="text-4xl font-bold text-slate-900">{tier.price}</span>
                                            <span className="text-slate-600 ml-2">/{tier.period}</span>
                                        </div>
                                        <p className="text-slate-600 mt-2">{tier.description}</p>
                                    </CardHeader>
                                    <CardContent>
                                        <Button
                                            onClick={() => handleUpgrade(tier)}
                                            className={`w-full mb-6 ${tier.popular
                                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                                                    : ''
                                                }`}
                                            variant={tier.popular ? 'default' : 'outline'}
                                        >
                                            {tier.cta}
                                        </Button>

                                        <ul className="space-y-3">
                                            {tier.features.map((feature, idx) => (
                                                <li key={idx} className="flex items-start gap-3">
                                                    {feature.included ? (
                                                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                    ) : (
                                                        <X className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />
                                                    )}
                                                    <span className={feature.included ? 'text-slate-700' : 'text-slate-400'}>
                                                        {feature.text}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Social Proof */}
            <section className="py-20 bg-gradient-to-br from-amber-50 to-orange-50">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-4xl font-bold text-slate-900 mb-2">10,000+</div>
                            <div className="text-slate-600">Videos Created</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-slate-900 mb-2">15+</div>
                            <div className="text-slate-600">Languages Supported</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-slate-900 mb-2">99.9%</div>
                            <div className="text-slate-600">Uptime</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-slate-900 mb-2">24/7</div>
                            <div className="text-slate-600">Support</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-slate-900 mb-4">
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div className="space-y-6">
                        {FAQS.map((faq, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.05 }}
                                viewport={{ once: true }}
                            >
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">{faq.question}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-slate-600">{faq.answer}</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-20 bg-gradient-to-r from-amber-500 to-orange-500">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold text-white mb-6">
                        Ready to Create Amazing Videos?
                    </h2>
                    <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                        Join thousands of creators using AI to bring their stories to life
                    </p>
                    <Button
                        onClick={handleGetStarted}
                        size="lg"
                        className="bg-white text-amber-600 hover:bg-slate-100 text-lg px-8 py-6"
                    >
                        <Sparkles className="w-5 h-5 mr-2" />
                        Start Creating Free
                        <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 bg-slate-900 text-white">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg">
                                <Film className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold">Cuts & Flow</span>
                        </div>

                        <div className="flex gap-6 text-sm text-slate-400">
                            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                            <a href="#" className="hover:text-white transition-colors">Contact</a>
                        </div>

                        <div className="text-sm text-slate-400">
                            © 2024 Cuts & Flow. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}