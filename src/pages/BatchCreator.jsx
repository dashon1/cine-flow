import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Layers, Plus, Trash2, Zap, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BatchCreator() {
    const [scripts, setScripts] = useState([{ title: '', content: '', language: 'en' }]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [queuedProjects, setQueuedProjects] = useState([]);
    const [user, setUser] = useState(null);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);
        } catch (err) {
            console.error('Error loading user');
        }
    };

    const addScript = () => {
        setScripts([...scripts, { title: '', content: '', language: 'en' }]);
    };

    const removeScript = (index) => {
        setScripts(scripts.filter((_, i) => i !== index));
    };

    const updateScript = (index, field, value) => {
        const updated = [...scripts];
        updated[index][field] = value;
        setScripts(updated);
    };

    const handleBatchGenerate = async () => {
        const validScripts = scripts.filter(s => s.content.trim().length > 0);
        
        if (validScripts.length === 0) {
            alert('Please add at least one script');
            return;
        }

        const maxBatch = user?.plan_type === 'enterprise' ? 50 : user?.plan_type === 'pro' ? 10 : 3;
        
        if (validScripts.length > maxBatch) {
            alert(`Your tier allows ${maxBatch} videos at once. Please remove ${validScripts.length - maxBatch} scripts.`);
            return;
        }

        setIsGenerating(true);
        setProgress(0);

        try {
            const { data } = await base44.functions.invoke('batchGenerateVideos', {
                scripts: validScripts,
                settings: {
                    aspect_ratio: '16:9',
                    resolution: '1080p'
                }
            });

            if (data.error) {
                throw new Error(data.error);
            }

            setQueuedProjects(data.queued_projects);
            setProgress(100);
            alert(`Successfully queued ${data.total_videos} videos for generation!`);
        } catch (err) {
            console.error('Batch generation error:', err);
            alert(err.message || 'Failed to start batch generation');
        } finally {
            setIsGenerating(false);
        }
    };

    const getBatchLimit = () => {
        return user?.plan_type === 'enterprise' ? 50 : user?.plan_type === 'pro' ? 10 : 3;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-100 p-6">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                        <Layers className="w-10 h-10 text-orange-500" />
                        Batch Video Creator
                    </h1>
                    <p className="text-gray-600">Generate multiple videos at once - perfect for content calendars</p>
                    <Badge variant="outline" className="mt-2">
                        Your limit: {getBatchLimit()} videos per batch
                    </Badge>
                </div>

                {scripts.length >= getBatchLimit() && (
                    <Alert className="mb-6 border-amber-500 bg-amber-50">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800">
                            You've reached your batch limit of {getBatchLimit()} videos. {user?.plan_type === 'free' && 'Upgrade to Pro for 10 videos per batch.'}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="space-y-4 mb-6">
                    {scripts.map((script, index) => (
                        <Card key={index} className="bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">Video {index + 1}</CardTitle>
                                    {scripts.length > 1 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeScript(index)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <Input
                                        placeholder="Video title..."
                                        value={script.title}
                                        onChange={(e) => updateScript(index, 'title', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Textarea
                                        placeholder="Enter script..."
                                        value={script.content}
                                        onChange={(e) => updateScript(index, 'content', e.target.value)}
                                        className="min-h-[120px]"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">{script.content.length} characters</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={addScript}
                        disabled={scripts.length >= getBatchLimit()}
                        className="flex-1"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Another Script
                    </Button>

                    <Button
                        onClick={handleBatchGenerate}
                        disabled={isGenerating || scripts.filter(s => s.content.trim()).length === 0}
                        className="flex-1 bg-gradient-to-r from-orange-500 to-red-500"
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Queueing...
                            </>
                        ) : (
                            <>
                                <Zap className="w-4 h-4 mr-2" />
                                Generate {scripts.filter(s => s.content.trim()).length} Videos
                            </>
                        )}
                    </Button>
                </div>

                {isGenerating && (
                    <Card className="mt-6">
                        <CardContent className="p-6">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">Processing Batch...</h3>
                                    <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {queuedProjects.length > 0 && (
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Queued Videos ({queuedProjects.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {queuedProjects.map((project, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium">Video {project.position}</p>
                                            <p className="text-xs text-gray-500">Project ID: {project.project_id}</p>
                                        </div>
                                        <Badge className="bg-blue-500">
                                            {project.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}