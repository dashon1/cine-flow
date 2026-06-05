import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { Music, Play, Pause, Check, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

export default function MusicSelector({ selectedTrackId, onSelect }) {
    const [tracks, setTracks] = useState([]);
    const [playingTrack, setPlayingTrack] = useState(null);
    const [audioElement, setAudioElement] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const cleanupAudio = useCallback(() => {
        if (audioElement) {
            try {
                audioElement.pause();
                audioElement.removeAttribute('src');
                audioElement.load();
            } catch (e) {
                // Silently ignore cleanup errors
            }
            setAudioElement(null);
        }
        setPlayingTrack(null);
    }, [audioElement]);

    useEffect(() => {
        loadTracks();
        return () => cleanupAudio();
    }, [cleanupAudio]);

    const loadTracks = async () => {
        setIsLoading(true);
        try {
            const allTracks = await base44.entities.MusicTrack.filter({ is_active: true });
            setTracks(allTracks);
        } catch (err) {
            console.error('Error loading music tracks:', err);
        }
        setIsLoading(false);
    };

    const handlePlay = useCallback((track, e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        // If already playing this track, stop it
        if (playingTrack === track.id && audioElement) {
            cleanupAudio();
            return;
        }

        // Cleanup any existing audio first
        if (audioElement) {
            try {
                audioElement.pause();
                audioElement.removeAttribute('src');
                audioElement.load();
            } catch (err) {
                // Silently ignore errors
            }
            setAudioElement(null);
        }

        // Get audio URL and validate it
        const audioUrl = track.preview_url || track.file_url;
        
        if (!audioUrl || typeof audioUrl !== 'string' || audioUrl.trim() === '') {
            console.warn('No valid audio URL available for track:', track.title);
            return;
        }

        const trimmedUrl = audioUrl.trim();

        // Additional validation: check if URL is actually a valid URL
        try {
            new URL(trimmedUrl);
        } catch (urlError) {
            console.warn('Invalid audio URL format for track:', track.title);
            return;
        }

        try {
            const audio = new Audio();
            
            // Set up error handler BEFORE setting src
            audio.addEventListener('error', (errEvent) => {
                const errorType = audio.error?.code;
                // Only log meaningful errors
                if (errorType && errorType !== 1) {
                    console.warn("Audio playback error:", track.title, errorType);
                }
                cleanupAudio();
            }, { once: true });
            
            audio.addEventListener('ended', () => {
                cleanupAudio();
            }, { once: true });

            // Set volume AFTER creating element
            audio.volume = 0.3;

            // Set source AFTER all handlers are attached
            audio.src = trimmedUrl;
            
            // Load the audio
            audio.load();
            
            // Attempt to play
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        setPlayingTrack(track.id);
                        setAudioElement(audio);
                    })
                    .catch(err => {
                        if (!err.message.includes('aborted') && 
                            !err.message.includes('interrupted') && 
                            err.name !== 'AbortError') {
                            console.warn("Audio play failed:", track.title, err.message);
                        }
                        cleanupAudio();
                    });
            } else {
                setPlayingTrack(track.id);
                setAudioElement(audio);
            }
            
        } catch (error) {
            console.warn('Failed to create audio element:', track.title, error.message);
        }
    }, [audioElement, playingTrack, cleanupAudio]);

    const handleItemClick = (trackId) => {
        // Stop any playing audio when selecting a new track
        if (audioElement) {
            cleanupAudio();
        }
        onSelect(trackId);
    };

    return (
        <Card className="bg-white/60 backdrop-blur-sm border-gray-200">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Music className="w-5 h-5 text-amber-500" />
                        Background Music
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={loadTracks}
                        disabled={isLoading}
                        className="h-8 w-8"
                        title="Refresh music list"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center py-4">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-amber-400 border-t-amber-500 rounded-full animate-spin" />
                            <p className="text-sm text-gray-500">Loading tracks...</p>
                        </div>
                    </div>
                ) : tracks.length === 0 ? (
                    <div className="text-center py-4">
                        <p className="text-sm text-gray-500 mb-2">
                            No music tracks available.
                        </p>
                        <p className="text-xs text-gray-400">
                            Visit the Music Library to add tracks.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        <Button
                            variant={!selectedTrackId ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleItemClick(null)}
                            className="w-full justify-start"
                        >
                            {!selectedTrackId && <Check className="w-4 h-4 mr-2" />}
                            No Background Music
                        </Button>

                        {tracks.map((track) => {
                            const hasValidAudio = (track.preview_url || track.file_url) && 
                                                 (track.preview_url?.trim() || track.file_url?.trim());
                            
                            return (
                                <motion.div
                                    key={track.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <div
                                        className={`
                                            p-3 rounded-lg border transition-all cursor-pointer
                                            ${selectedTrackId === track.id 
                                                ? 'border-amber-500 bg-amber-50' 
                                                : 'border-gray-200 bg-white hover:bg-gray-50'
                                            }
                                        `}
                                        onClick={() => handleItemClick(track.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Play/Pause Button */}
                                            {hasValidAudio ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => handlePlay(track, e)}
                                                    className={`flex-shrink-0 h-10 w-10 rounded-full ${
                                                        playingTrack === track.id 
                                                            ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                                                            : 'bg-gray-100 hover:bg-gray-200'
                                                    }`}
                                                    title={playingTrack === track.id ? "Pause" : "Play preview"}
                                                >
                                                    {playingTrack === track.id ? (
                                                        <Pause className="w-5 h-5" />
                                                    ) : (
                                                        <Play className="w-5 h-5 ml-0.5" />
                                                    )}
                                                </Button>
                                            ) : (
                                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <Music className="w-4 h-4 text-gray-400" />
                                                </div>
                                            )}

                                            {/* Track Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-sm font-medium text-gray-900 truncate">
                                                        {track.title}
                                                    </h4>
                                                    {selectedTrackId === track.id && (
                                                        <Check className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                                    )}
                                                </div>
                                                {track.artist && (
                                                    <p className="text-xs text-gray-500 truncate">{track.artist}</p>
                                                )}
                                                <div className="flex gap-1 mt-1.5">
                                                    {track.genre && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {track.genre}
                                                        </Badge>
                                                    )}
                                                    {track.mood && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {track.mood}
                                                        </Badge>
                                                    )}
                                                    {!hasValidAudio && (
                                                        <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
                                                            No Preview
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}