import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";
import {
    Settings, Cpu, Users, CreditCard,
    Database, BarChart3, Shield, Zap
} from "lucide-react";
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion } from "framer-motion";

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalModels: 0,
        activeModels: 0,
        totalUsers: 0,
        totalPrompts: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        setIsLoading(true);
        try {
            const [models, users, prompts] = await Promise.all([
                base44.entities.AIModelConfig.list(),
                base44.entities.User.list(),
                base44.entities.SystemPrompt.list()
            ]);

            setStats({
                totalModels: models.length,
                activeModels: models.filter(m => m.is_active).length,
                totalUsers: users.length,
                totalPrompts: prompts.length
            });
        } catch (err) {
            console.error('Error loading stats:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const adminSections = [
        {
            title: 'Model Registry',
            description: 'Configure AI models, providers, and quality settings',
            icon: Cpu,
            link: 'AdminModelRegistry',
            color: 'from-blue-500 to-cyan-500',
            stat: `${stats.activeModels}/${stats.totalModels} Active`
        },
        {
            title: 'System Prompts',
            description: 'Manage AI prompts and templates for generation',
            icon: Database,
            link: 'AdminPrompts',
            color: 'from-purple-500 to-pink-500',
            stat: `${stats.totalPrompts} Prompts`
        },
        {
            title: 'Global Settings',
            description: 'API keys, integrations, and system configuration',
            icon: Settings,
            link: 'AdminGlobalSettings',
            color: 'from-amber-500 to-orange-500',
            stat: 'Configure'
        },
        {
            title: 'User Management',
            description: 'Manage users, plans, credits, and permissions',
            icon: Users,
            link: 'AdminUserManagement',
            color: 'from-green-500 to-emerald-500',
            stat: `${stats.totalUsers} Users`
        },
        {
            title: 'Tier & Pricing',
            description: 'Configure subscription tiers and feature access',
            icon: CreditCard,
            link: 'AdminTierManagement',
            color: 'from-indigo-500 to-blue-500',
            stat: '3 Tiers'
        },
        {
            title: 'System Monitor',
            description: 'View logs, audit trail, and system health',
            icon: BarChart3,
            link: 'AdminSystemMonitor',
            color: 'from-red-500 to-rose-500',
            stat: 'Monitor'
        }
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-center items-center min-h-[400px]">
                        <div className="w-12 h-12 border-4 border-blue-400 border-t-blue-600 rounded-full animate-spin" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-6">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-10 h-10 text-blue-400" />
                        <h1 className="text-4xl font-bold text-white">
                            Admin Dashboard
                        </h1>
                    </div>
                    <p className="text-slate-400 text-lg">
                        Central control panel for Cuts & Flow system configuration
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {adminSections.map((section, index) => {
                        const Icon = section.icon;
                        return (
                            <motion.div
                                key={section.link}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Link to={createPageUrl(section.link)}>
                                    <Card className="bg-slate-900 border-slate-800 hover:border-blue-500 transition-all duration-300 h-full cursor-pointer group">
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className={`p-3 rounded-lg bg-gradient-to-br ${section.color}`}>
                                                    <Icon className="w-6 h-6 text-white" />
                                                </div>
                                                <Badge variant="outline" className="text-slate-400 border-slate-700">
                                                    {section.stat}
                                                </Badge>
                                            </div>
                                            <CardTitle className="text-white mt-4 group-hover:text-blue-400 transition-colors">
                                                {section.title}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-slate-400 text-sm">
                                                {section.description}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-8"
                >
                    <Alert className="bg-blue-950 border-blue-800">
                        <Zap className="h-4 w-4 text-blue-400" />
                        <AlertDescription className="text-blue-200">
                            <strong>Quick Tip:</strong> Start with Model Registry to configure your AI providers, then set up System Prompts for optimal generation quality.
                        </AlertDescription>
                    </Alert>
                </motion.div>
            </div>
        </div>
    );
}