import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";
import { Download, Trash2, Play, Video, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SavedVideosManager({ onLoadProject }) {
    const [videos, setVideos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadVideos();
    }, []);

    const loadVideos = async () => {
        setIsLoading(true);
        try {
            const user = await base44.auth.me();
            const allVideos = await base44.entities.GeneratedVideo.filter(
                { created_by: user.email },
                '-created_date',
                50
            );
            setVideos(allVideos);
        } catch (err) {
            console.error('Error loading videos:', err);
            setError('Failed to load saved videos');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (videoId) => {
        if (!window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
            return;
        }

        try {
            await base44.entities.GeneratedVideo.delete(videoId);
            setSuccess('Video deleted successfully');
            setTimeout(() => setSuccess(''), 3000);
            await loadVideos();
        } catch (err) {
            console.error('Error deleting video:', err);
            setError('Failed to delete video');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleDownload = async (video) => {
        try {
            const response = await fetch(video.video_url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `video_${video.id}.${video.generation_mode === 'canvas' ? 'webm' : 'mp4'}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (err) {
            console.error('Error downloading video:', err);
            setError('Failed to download video');
            setTimeout(() => setError(''), 3000);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-purple-500" />
                    My Videos ({videos.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                {error && (
                    <Alert className="mb-4 border-red-500 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <AlertDescription className="text-red-700">{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="mb-4 border-green-500 bg-green-50">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <AlertDescription className="text-green-700">{success}</AlertDescription>
                    </Alert>
                )}

                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">Loading videos...</p>
                    </div>
                ) : videos.length === 0 ? (
                    <div className="text-center py-12">
                        <Video className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-600 mb-2">No saved videos yet</p>
                        <p className="text-sm text-gray-500">Your generated videos will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        <AnimatePresence>
                            {videos.map((video) => (
                                <motion.div
                                    key={video.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex gap-3">
                                        {video.thumbnail_url ? (
                                            <img
                                                src={video.thumbnail_url}
                                                alt="Video thumbnail"
                                                className="w-24 h-16 object-cover rounded flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-24 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded flex items-center justify-center flex-shrink-0">
                                                <Video className="w-8 h-8 text-purple-400" />
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Badge variant="outline" className="text-xs">
                                                            {video.resolution || '720p'}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs">
                                                            {video.aspect_ratio || '16:9'}
                                                        </Badge>
                                                        {video.status === 'completed' ? (
                                                            <Badge className="bg-green-500 text-white text-xs">
                                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                                Ready
                                                            </Badge>
                                                        ) : video.status === 'generating' ? (
                                                            <Badge className="bg-blue-500 text-white text-xs">
                                                                Processing...
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-red-500 text-white text-xs">
                                                                Failed
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-xs text-gray-500 space-y-1">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(video.created_date)}
                                                </div>
                                                {video.duration && (
                                                    <div>Duration: {formatDuration(video.duration)}</div>
                                                )}
                                                {video.file_size && (
                                                    <div>Size: {formatFileSize(video.file_size)}</div>
                                                )}
                                            </div>

                                            {video.status === 'completed' && video.video_url && (
                                                <div className="flex gap-2 mt-3">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => window.open(video.video_url, '_blank')}
                                                        className="flex-1"
                                                    >
                                                        <Play className="w-3 h-3 mr-1" />
                                                        Watch
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDownload(video)}
                                                        className="flex-1"
                                                    >
                                                        <Download className="w-3 h-3 mr-1" />
                                                        Download
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(video.id)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}