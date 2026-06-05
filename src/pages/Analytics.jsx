import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Eye, Download, Share2, Film } from "lucide-react";

export default function Analytics() {
    const [userAnalytics, setUserAnalytics] = useState(null);
    const [videoAnalytics, setVideoAnalytics] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            const user = await base44.auth.me();
            
            // Load user analytics
            const userStats = await base44.entities.UserAnalytics.filter({ 
                created_by: user.email 
            });
            if (userStats.length > 0) {
                setUserAnalytics(userStats[0]);
            }

            // Load video analytics
            const videos = await base44.entities.GeneratedVideo.filter({ 
                created_by: user.email 
            });
            
            const videoStats = [];
            for (const video of videos.slice(0, 10)) {
                const stats = await base44.entities.VideoAnalytics.filter({ video_id: video.id });
                if (stats.length > 0) {
                    videoStats.push({ ...stats[0], video });
                }
            }
            setVideoAnalytics(videoStats);

        } catch (err) {
            console.error('Error loading analytics:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-100 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
                    <p className="text-gray-600">Track your video performance and insights</p>
                </div>

                {/* Overview Cards */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Total Videos</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {userAnalytics?.total_videos_generated || 0}
                                    </p>
                                </div>
                                <div className="p-3 bg-purple-100 rounded-lg">
                                    <Film className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Total Views</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {videoAnalytics.reduce((sum, v) => sum + (v.views_count || 0), 0)}
                                    </p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <Eye className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Total Downloads</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {videoAnalytics.reduce((sum, v) => sum + (v.download_count || 0), 0)}
                                    </p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <Download className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Total Shares</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {videoAnalytics.reduce((sum, v) => sum + (v.share_count || 0), 0)}
                                    </p>
                                </div>
                                <div className="p-3 bg-pink-100 rounded-lg">
                                    <Share2 className="w-6 h-6 text-pink-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 max-w-md">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="engagement">Engagement</TabsTrigger>
                        <TabsTrigger value="platforms">Platforms</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Video Performance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={videoAnalytics.slice(0, 5).map((v, i) => ({
                                        name: `Video ${i + 1}`,
                                        views: v.views_count || 0,
                                        downloads: v.download_count || 0,
                                        shares: v.share_count || 0
                                    }))}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="views" fill="#8b5cf6" />
                                        <Bar dataKey="downloads" fill="#10b981" />
                                        <Bar dataKey="shares" fill="#ec4899" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="engagement">
                        <Card>
                            <CardHeader>
                                <CardTitle>Completion Rates</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={videoAnalytics.slice(0, 5).map((v, i) => ({
                                        name: `Video ${i + 1}`,
                                        completion: v.completion_rate || 0,
                                        avgWatch: v.avg_watch_time || 0
                                    }))}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="completion" stroke="#8b5cf6" strokeWidth={2} />
                                        <Line type="monotone" dataKey="avgWatch" stroke="#3b82f6" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="platforms">
                        <Card>
                            <CardHeader>
                                <CardTitle>Platform Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'YouTube', value: videoAnalytics.reduce((sum, v) => sum + (v.platform_shares?.youtube || 0), 0) },
                                                { name: 'TikTok', value: videoAnalytics.reduce((sum, v) => sum + (v.platform_shares?.tiktok || 0), 0) },
                                                { name: 'Instagram', value: videoAnalytics.reduce((sum, v) => sum + (v.platform_shares?.instagram || 0), 0) },
                                                { name: 'Twitter', value: videoAnalytics.reduce((sum, v) => sum + (v.platform_shares?.twitter || 0), 0) }
                                            ].filter(p => p.value > 0)}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={(entry) => `${entry.name}: ${entry.value}`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {COLORS.map((color, index) => (
                                                <Cell key={`cell-${index}`} fill={color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}