import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Pause, Download, Wand2, Type, Music, Film } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";

import VideoTimeline from '../components/videoEditor/VideoTimeline';
import VideoFilters from '../components/videoEditor/VideoFilters';
import TextOverlayEditor from '../components/videoEditor/TextOverlayEditor';
import AudioMixer from '../components/videoEditor/AudioMixer';
import VideoPreview from '../components/videoEditor/VideoPreview';

export default function VideoEditor() {
    const [videoFile, setVideoFile] = useState(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    
    const [clips, setClips] = useState([]);
    const [selectedClip, setSelectedClip] = useState(null);
    
    const [filters, setFilters] = useState({
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0,
        grayscale: 0,
        sepia: 0
    });
    
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
    
    const [textOverlays, setTextOverlays] = useState([]);
    
    const [audioTracks, setAudioTracks] = useState({
        voiceover: { url: null, volume: 1.0 },
        background: { url: null, volume: 0.5 }
    });
    
    const videoRef = useRef(null);
    const fileInputRef = useRef(null);
    
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('video/')) {
            setVideoFile(file);
            const url = URL.createObjectURL(file);
            setVideoUrl(url);
            setClips([{
                id: Date.now(),
                url: url,
                start: 0,
                end: 0,
                duration: 0
            }]);
            setError('');
        } else {
            setError('Please select a valid video file');
        }
    };
    
    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };
    
    const handleVideoLoaded = () => {
        if (videoRef.current) {
            const dur = videoRef.current.duration;
            setDuration(dur);
            if (clips.length > 0) {
                setClips(prev => prev.map(clip => ({
                    ...clip,
                    end: dur,
                    duration: dur
                })));
            }
        }
    };
    
    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };
    
    const handleExport = async () => {
        setIsProcessing(true);
        setError('');
        
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const video = videoRef.current;
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const fps = 30;
            const chunks = [];
            
            const stream = canvas.captureStream(fps);
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: 5000000
            });
            
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `edited-video-${Date.now()}.webm`;
                a.click();
                URL.revokeObjectURL(url);
                setIsProcessing(false);
            };
            
            mediaRecorder.start();
            video.currentTime = 0;
            
            const renderFrame = () => {
                if (video.currentTime >= duration) {
                    mediaRecorder.stop();
                    return;
                }
                
                ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) blur(${filters.blur}px) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%)`;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                textOverlays.forEach(overlay => {
                    if (video.currentTime >= overlay.startTime && video.currentTime <= overlay.endTime) {
                        ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
                        ctx.fillStyle = overlay.color;
                        ctx.textAlign = overlay.align || 'center';
                        ctx.fillText(overlay.text, overlay.x, overlay.y);
                    }
                });
                
                requestAnimationFrame(renderFrame);
            };
            
            video.play();
            renderFrame();
            
        } catch (err) {
            console.error('Export error:', err);
            setError('Failed to export video. Please try again.');
            setIsProcessing(false);
        }
    };
    
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = playbackSpeed;
        }
    }, [playbackSpeed]);
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 p-6">
            <div className="container mx-auto max-w-7xl">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                                <Film className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Video Editor</h1>
                                <p className="text-gray-600">Professional video editing tools</p>
                            </div>
                        </div>
                        
                        <div className="flex gap-3">
                            {!videoUrl && (
                                <Button onClick={() => fileInputRef.current?.click()}>
                                    Upload Video
                                </Button>
                            )}
                            {videoUrl && (
                                <Button
                                    onClick={handleExport}
                                    disabled={isProcessing}
                                    className="bg-gradient-to-r from-purple-500 to-pink-500"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    {isProcessing ? 'Exporting...' : 'Export Video'}
                                </Button>
                            )}
                        </div>
                    </div>
                </motion.div>
                
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                />
                
                {error && (
                    <Alert className="mb-6 border-red-500 bg-red-50">
                        <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>
                )}
                
                {!videoUrl ? (
                    <Card className="p-12 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <Film className="w-16 h-16 text-gray-400" />
                            <h3 className="text-xl font-semibold text-gray-700">No Video Loaded</h3>
                            <p className="text-gray-500">Upload a video to start editing</p>
                            <Button onClick={() => fileInputRef.current?.click()}>
                                Upload Video
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <VideoPreview
                                videoRef={videoRef}
                                videoUrl={videoUrl}
                                isPlaying={isPlaying}
                                filters={filters}
                                textOverlays={textOverlays}
                                currentTime={currentTime}
                                onLoadedMetadata={handleVideoLoaded}
                                onTimeUpdate={handleTimeUpdate}
                            />
                            
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-center gap-4">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={handlePlayPause}
                                        >
                                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                        </Button>
                                        <div className="flex-1">
                                            <input
                                                type="range"
                                                min="0"
                                                max={duration || 100}
                                                value={currentTime}
                                                onChange={(e) => {
                                                    const time = parseFloat(e.target.value);
                                                    setCurrentTime(time);
                                                    if (videoRef.current) {
                                                        videoRef.current.currentTime = time;
                                                    }
                                                }}
                                                className="w-full"
                                            />
                                        </div>
                                        <span className="text-sm text-gray-600 min-w-[100px]">
                                            {Math.floor(currentTime)}s / {Math.floor(duration)}s
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <VideoTimeline
                                clips={clips}
                                setClips={setClips}
                                duration={duration}
                                currentTime={currentTime}
                                onSeek={(time) => {
                                    if (videoRef.current) {
                                        videoRef.current.currentTime = time;
                                        setCurrentTime(time);
                                    }
                                }}
                                playbackSpeed={playbackSpeed}
                                setPlaybackSpeed={setPlaybackSpeed}
                            />
                        </div>
                        
                        <div className="space-y-6">
                            <Tabs defaultValue="filters" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="filters">
                                        <Wand2 className="w-4 h-4 mr-2" />
                                        Filters
                                    </TabsTrigger>
                                    <TabsTrigger value="text">
                                        <Type className="w-4 h-4 mr-2" />
                                        Text
                                    </TabsTrigger>
                                    <TabsTrigger value="audio">
                                        <Music className="w-4 h-4 mr-2" />
                                        Audio
                                    </TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="filters">
                                    <VideoFilters
                                        filters={filters}
                                        setFilters={setFilters}
                                    />
                                </TabsContent>
                                
                                <TabsContent value="text">
                                    <TextOverlayEditor
                                        textOverlays={textOverlays}
                                        setTextOverlays={setTextOverlays}
                                        currentTime={currentTime}
                                        duration={duration}
                                    />
                                </TabsContent>
                                
                                <TabsContent value="audio">
                                    <AudioMixer
                                        audioTracks={audioTracks}
                                        setAudioTracks={setAudioTracks}
                                    />
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}