import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function PaymentSuccess() {
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    navigate(createPageUrl('Home'));
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-2xl w-full"
            >
                <Card className="border-2 border-green-200 shadow-2xl">
                    <CardHeader className="text-center pb-2">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="inline-block mx-auto mb-4"
                        >
                            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-12 h-12 text-white" />
                            </div>
                        </motion.div>
                        <CardTitle className="text-3xl font-bold text-slate-900">
                            Payment Successful!
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-6">
                        <p className="text-lg text-slate-600">
                            Thank you for upgrading! Your subscription is now active and you have access to all premium features.
                        </p>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-3">
                            <div className="flex items-center justify-center gap-2 text-green-700">
                                <Sparkles className="w-5 h-5" />
                                <span className="font-semibold">What's unlocked:</span>
                            </div>
                            <ul className="text-left text-sm text-slate-700 space-y-2 max-w-md mx-auto">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span>Access to premium AI models (GPT-4o, Claude, Gemini)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span>ElevenLabs premium voices</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span>Higher quality image generation</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span>Increased daily limits</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span>1080p exports with no watermark</span>
                                </li>
                            </ul>
                        </div>

                        <div className="space-y-3">
                            <Button
                                onClick={() => navigate(createPageUrl('Home'))}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                                size="lg"
                            >
                                Start Creating Amazing Videos
                                <ChevronRight className="w-5 h-5 ml-2" />
                            </Button>

                            <p className="text-sm text-slate-500">
                                Redirecting in {countdown} seconds...
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}