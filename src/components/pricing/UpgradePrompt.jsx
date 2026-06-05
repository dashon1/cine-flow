import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Check, Zap } from "lucide-react";
import { stripeCheckout } from "@/functions/stripeCheckout";

export default function UpgradePrompt({ currentTier, feature }) {
    const handleUpgrade = async (planType, priceId) => {
        try {
            const { url } = await stripeCheckout({ 
                priceId: priceId,
                planType: planType
            });
            
            if (url) {
                window.location.href = url;
            }
        } catch (err) {
            console.error('Upgrade error:', err);
        }
    };

    const plans = [
        {
            name: 'Pro',
            planType: 'pro',
            priceId: 'price_pro_monthly', // Replace with your actual Stripe price ID
            price: '$29',
            period: 'month',
            features: [
                '50 videos per day',
                'Premium AI models',
                'Manual review workflow',
                'Priority processing',
                'HD exports (1080p)'
            ],
            popular: true
        },
        {
            name: 'Enterprise',
            planType: 'enterprise',
            priceId: 'price_enterprise_monthly', // Replace with your actual Stripe price ID
            price: '$99',
            period: 'month',
            features: [
                'Unlimited videos',
                'All premium models',
                'Custom model training',
                'API access',
                '4K exports',
                'Priority support'
            ]
        }
    ];

    if (currentTier !== 'free') {
        return null;
    }

    return (
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-600" />
                    Upgrade to Access {feature}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                    {plans.map((plan) => (
                        <div 
                            key={plan.planType}
                            className={`relative p-4 rounded-lg border-2 ${
                                plan.popular 
                                    ? 'border-amber-500 bg-white shadow-lg' 
                                    : 'border-gray-200 bg-white'
                            }`}
                        >
                            {plan.popular && (
                                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-500">
                                    Most Popular
                                </Badge>
                            )}
                            
                            <div className="text-center mb-4">
                                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                                <div className="mt-2">
                                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                                    <span className="text-gray-600">/{plan.period}</span>
                                </div>
                            </div>

                            <ul className="space-y-2 mb-4">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm">
                                        <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                onClick={() => handleUpgrade(plan.planType, plan.priceId)}
                                className={`w-full ${
                                    plan.popular
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                        : 'bg-gray-900'
                                }`}
                            >
                                <Zap className="w-4 h-4 mr-2" />
                                Upgrade to {plan.name}
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}