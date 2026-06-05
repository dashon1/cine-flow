import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Zap } from "lucide-react";

export default function RateLimitNotice({ current, limit }) {
    const percentage = (current / limit) * 100;
    const remaining = limit - current;
    
    if (remaining <= 0) {
        return (
            <Alert className="border-red-500 bg-red-50">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <AlertDescription className="ml-2 text-red-800">
                    <p className="font-semibold mb-1">Daily Limit Reached</p>
                    <p className="text-sm">
                        You've reached your daily limit of {limit} videos. Your limit will reset tomorrow.
                    </p>
                </AlertDescription>
            </Alert>
        );
    }
    
    if (percentage >= 80) {
        return (
            <Alert className="border-amber-500 bg-amber-50">
                <Zap className="h-5 w-5 text-amber-600" />
                <AlertDescription className="ml-2">
                    <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-amber-900">
                            {remaining} video{remaining !== 1 ? 's' : ''} remaining today
                        </p>
                        <span className="text-sm text-amber-700">{current}/{limit}</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                </AlertDescription>
            </Alert>
        );
    }
    
    return null;
}