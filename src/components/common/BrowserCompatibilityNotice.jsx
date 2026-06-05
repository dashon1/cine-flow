import React, { useState, useEffect, useCallback } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, Chrome } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BrowserCompatibilityNotice() {
    const [showNotice, setShowNotice] = useState(false);
    const [browserInfo, setBrowserInfo] = useState({ name: '', isSupported: true });

    const detectBrowser = useCallback(() => {
        const ua = navigator.userAgent;
        
        // Chrome or Edge (Chromium)
        if (ua.includes('Chrome') || ua.includes('Edg')) {
            return { name: 'Chrome/Edge', isSupported: true };
        }
        
        // Firefox
        if (ua.includes('Firefox')) {
            return { name: 'Firefox', isSupported: false, warning: 'limited audio/video support' };
        }
        
        // Safari
        if (ua.includes('Safari') && !ua.includes('Chrome')) {
            return { name: 'Safari', isSupported: false, warning: 'limited audio/video support' };
        }
        
        return { name: 'Unknown', isSupported: false, warning: 'unknown compatibility' };
    }, []);

    const checkBrowserCompatibility = useCallback(() => {
        try {
            const dismissed = localStorage.getItem('browser_notice_dismissed');
            if (dismissed) return;

            const info = detectBrowser();
            setBrowserInfo(info);
            
            if (!info.isSupported) {
                setShowNotice(true);
            }
        } catch (err) {
            // LocalStorage might not be available
            console.log('Cannot check browser compatibility');
        }
    }, [detectBrowser]);

    useEffect(() => {
        checkBrowserCompatibility();
    }, [checkBrowserCompatibility]);

    const handleDismiss = () => {
        try {
            localStorage.setItem('browser_notice_dismissed', 'true');
        } catch (err) {
            console.log('Cannot save to localStorage');
        }
        setShowNotice(false);
    };

    if (!showNotice) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4"
            >
                <Alert className="border-amber-500 bg-amber-50 shadow-lg">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <AlertDescription className="ml-2 flex items-start justify-between gap-3">
                        <div>
                            <p className="font-semibold text-amber-900 mb-1">
                                Browser Compatibility Notice
                            </p>
                            <p className="text-sm text-amber-800">
                                You're using <strong>{browserInfo.name}</strong> which may have {browserInfo.warning}. 
                                For the best experience, we recommend using <strong>Google Chrome or Microsoft Edge</strong>.
                            </p>
                            <div className="mt-2 flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open('https://www.google.com/chrome/', '_blank')}
                                    className="border-amber-600 text-amber-700 hover:bg-amber-100"
                                >
                                    <Chrome className="w-4 h-4 mr-2" />
                                    Download Chrome
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleDismiss}
                                    className="text-amber-700 hover:bg-amber-100"
                                >
                                    Continue Anyway
                                </Button>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleDismiss}
                            className="flex-shrink-0 h-6 w-6 text-amber-600 hover:bg-amber-100"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </AlertDescription>
                </Alert>
            </motion.div>
        </AnimatePresence>
    );
}