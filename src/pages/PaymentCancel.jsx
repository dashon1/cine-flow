import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function PaymentCancel() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-2xl w-full"
            >
                <Card className="border-2 border-slate-200 shadow-xl">
                    <CardHeader className="text-center pb-2">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="inline-block mx-auto mb-4"
                        >
                            <div className="w-24 h-24 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full flex items-center justify-center">
                                <XCircle className="w-12 h-12 text-white" />
                            </div>
                        </motion.div>
                        <CardTitle className="text-3xl font-bold text-slate-900">
                            Payment Cancelled
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-6">
                        <p className="text-lg text-slate-600">
                            Your payment was cancelled. No charges were made to your account.
                        </p>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-3">
                            <div className="flex items-center justify-center gap-2 text-blue-700">
                                <HelpCircle className="w-5 h-5" />
                                <span className="font-semibold">Need help choosing a plan?</span>
                            </div>
                            <p className="text-sm text-slate-700">
                                Our Free plan is perfect for getting started. You can always upgrade later when you need more features.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                onClick={() => navigate(createPageUrl('LandingPage'))}
                                variant="outline"
                                className="flex-1"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                View Pricing Again
                            </Button>

                            <Button
                                onClick={() => navigate(createPageUrl('Home'))}
                                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                            >
                                Continue with Free Plan
                            </Button>
                        </div>

                        <p className="text-sm text-slate-500 mt-4">
                            Questions? Contact our support team at support@yourdomain.com
                        </p>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}