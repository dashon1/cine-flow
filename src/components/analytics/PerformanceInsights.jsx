import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

export default function PerformanceInsights({ videoId }) {
    const [insights, setInsights] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (videoId) {
            loadInsights();
        }
    }, [videoId]);

    const loadInsights = async () => {
        setIsLoading(true);
        try {
            const { data } = await base44.functions.invoke('analyzeVideoPerformance', {
                video_id: videoId,
                timeframe: '7d'
            });

            if (data && !data.error) {
                setInsights(data);
            }
        } catch (err) {
            console.error('Error loading insights:', err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6 text-center">
                    <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto" />
                </CardContent>
            </Card>
        );
    }

    if (!insights || insights.insights.length === 0) {
        return (
            <Card>
                <CardContent className="p-6 text-center text-gray-500">
                    <Lightbulb className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No insights available yet</p>
                </CardContent>
            </Card>
        );
    }

    const getInsightIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            default: return <TrendingUp className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-purple-500" />
                    AI Insights
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-600">Total Views</p>
                        <p className="text-2xl font-bold text-blue-600">{insights.summary.total_views}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-gray-600">Completion</p>
                        <p className="text-2xl font-bold text-green-600">{insights.summary.avg_completion}%</p>
                    </div>
                </div>

                {/* Insights List */}
                {insights.insights.map((insight, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Alert className={`${
                            insight.type === 'success' ? 'border-green-500 bg-green-50' :
                            insight.type === 'warning' ? 'border-amber-500 bg-amber-50' :
                            'border-blue-500 bg-blue-50'
                        }`}>
                            {getInsightIcon(insight.type)}
                            <AlertDescription className="ml-2">
                                <p className="font-medium text-sm mb-1">{insight.message}</p>
                                <p className="text-xs text-gray-600">💡 {insight.recommendation}</p>
                            </AlertDescription>
                        </Alert>
                    </motion.div>
                ))}
            </CardContent>
        </Card>
    );
}