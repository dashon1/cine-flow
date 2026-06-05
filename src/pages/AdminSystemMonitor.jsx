import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuditLog } from '@/entities/AuditLog';
import { UserSettings } from '@/entities/UserSettings';
import { AIModelConfig } from '@/entities/AIModelConfig';
import { Activity, TrendingUp, AlertCircle, Clock, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminSystemMonitor() {
    const [auditLogs, setAuditLogs] = useState([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeModels: 0,
        todayGenerations: 0
    });
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const logs = await AuditLog.list('-created_date', 50);
            setAuditLogs(logs);

            const users = await UserSettings.list();
            const models = await AIModelConfig.filter({ is_active: true });
            
            const today = new Date().toISOString().split('T')[0];
            const todayUsers = users.filter(u => u.last_generation_date === today);
            const todayGenerations = todayUsers.reduce((sum, u) => sum + (u.daily_generations_count || 0), 0);

            setStats({
                totalUsers: users.length,
                activeModels: models.length,
                todayGenerations
            });
        } catch (err) {
            console.error('Error loading data:', err);
        }
    };

    const handleRefresh = () => {
        setMessage({ type: 'success', text: 'Refreshing data...' });
        loadData();
        setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Activity className="w-8 h-8 text-amber-500" />
                            System Monitor
                        </h1>
                        <p className="text-gray-600 mt-2">Track system usage and admin actions</p>
                    </div>
                    <Button onClick={handleRefresh} variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>

                {message.text && (
                    <Alert className="mb-6 border-green-500 bg-green-50">
                        <AlertDescription className="text-green-800">
                            {message.text}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Total Users</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <TrendingUp className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Active Models</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.activeModels}</p>
                                </div>
                                <div className="p-3 bg-purple-100 rounded-lg">
                                    <Activity className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Today's Generations</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.todayGenerations}</p>
                                </div>
                                <div className="p-3 bg-amber-100 rounded-lg">
                                    <Clock className="w-6 h-6 text-amber-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-500" />
                            Recent Admin Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {auditLogs.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No admin actions recorded yet</p>
                            ) : (
                                auditLogs.map((log) => (
                                    <div key={log.id} className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-start justify-between mb-2">
                                            <Badge className={`${
                                                log.action_type === 'model_config_change' ? 'bg-purple-100 text-purple-800' :
                                                log.action_type === 'tier_change' ? 'bg-amber-100 text-amber-800' :
                                                log.action_type === 'user_tier_update' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {log.action_type.replace(/_/g, ' ')}
                                            </Badge>
                                            <span className="text-xs text-gray-500">{formatDate(log.created_date)}</span>
                                        </div>
                                        <p className="text-sm text-gray-700 mb-1">{log.action_description}</p>
                                        <p className="text-xs text-gray-500">By: {log.admin_email}</p>
                                        {log.target_entity && (
                                            <p className="text-xs text-gray-400 mt-1">Target: {log.target_entity}</p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}