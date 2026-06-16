import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MusicTrack } from '@/entities/MusicTrack';
import { UploadFile } from '@/integrations/Core';
import { Music, Play, Pause, Plus, Edit2, Trash2, Save, X, AlertCircle, CheckCircle2, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SAMPLE_TRACKS = [
    { id: 'trk-epic', title: 'Epic Cinematic Rise', artist: 'AraM5 Studio', genre: 'cinematic', mood: 'epic', duration: 180, file_url: '', preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', is_active: true },
    { id: 'trk-upbeat', title: 'Upbeat Corporate', artist: 'AraM5 Studio', genre: 'corporate', mood: 'upbeat', duration: 120, file_url: '', preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', is_active: true },
    { id: 'trk-ambient', title: 'Calm Ambient Flow', artist: 'AraM5 Studio', genre: 'ambient', mood: 'calm', duration: 240, file_url: '', preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', is_active: true },
    { id: 'trk-inspire', title: 'Motivational Drive', artist: 'AraM5 Studio', genre: 'motivational', mood: 'inspiring', duration: 150, file_url: '', preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', is_active: true },
    { id: 'trk-dramatic', title: 'Dramatic Impact', artist: 'AraM5 Studio', genre: 'dramatic', mood: 'intense', duration: 90, file_url: '', preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', is_active: true },
];

export default function MusicLibrary() {
    const [tracks, setTracks] = useState(SAMPLE_TRACKS);
    const [isLoading, setIsLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingTrack, setEditingTrack] = useState(null);
    const [playingTrack, setPlayingTrack] = useState(null);
    const [audioElement, setAudioElement] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isPlayingPreview, setIsPlayingPreview] = useState(false);
    const [isTestingUrl, setIsTestingUrl] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        artist: '',
        genre: 'cinematic',
        mood: 'epic',
        duration: 180,
        file_url: '',
        preview_url: '',
        is_active: true
    });
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');

    const cleanupAudio = useCallback(() => {
        if (audioElement) {
            try {
                audioElement.pause();
                audioElement.src = '';
            } catch (e) {
                // Silently ignore
            }
            setAudioElement(null);
        }
        setPlayingTrack(null);
        setIsPlayingPreview(false);
    }, [audioElement]);

    useEffect(() => {
        loadTracks();
        return cleanupAudio;
    }, [cleanupAudio]);

    const loadTracks = async () => {
        setIsLoading(true);
        try {
            const allTracks = await MusicTrack.list('-updated_date');
            if (allTracks.length > 0) setTracks(allTracks);
        } catch (err) {
            setError('Failed to load music tracks');
        }
        setIsLoading(false);
    };

    const handlePlay = useCallback((track) => {
        if (playingTrack === track.id && audioElement) {
            cleanupAudio();
            return;
        }

        if (audioElement) {
            try {
                audioElement.pause();
                audioElement.src = '';
            } catch (e) {
                // Silently ignore
            }
            setAudioElement(null);
        }
        
        const audioUrl = track.preview_url || track.file_url;
        
        if (!audioUrl) {
            setError('No audio file URL available for this track');
            setTimeout(() => setError(''), 3000);
            return;
        }

        try {
            const audio = new Audio(audioUrl);
            audio.volume = 0.5;
            
            audio.addEventListener('error', (e) => {
                const errorType = audio.error?.code;
                if (errorType === 1) return;
                
                let errorMsg = '';
                if (errorType === 2) {
                    errorMsg = 'Cannot reach the audio file. Check your internet connection or the URL.';
                } else if (errorType === 3) {
                    errorMsg = 'Audio file format is not supported or file is corrupted.';
                } else if (errorType === 4) {
                    errorMsg = 'Audio file not found. The URL may be invalid or file was deleted.';
                } else {
                    errorMsg = 'Cannot play this audio file. Please check if the URL is a direct link to an audio file.';
                }
                
                setError(errorMsg);
                setTimeout(() => setError(''), 5000);
                setPlayingTrack(null);
                setAudioElement(null);
            }, { once: true });
            
            audio.addEventListener('ended', () => {
                setPlayingTrack(null);
                setAudioElement(null);
            }, { once: true });
            
            audio.play().catch(err => {
                if (!err.message.includes('aborted') && !err.message.includes('interrupted')) {
                    setError('Cannot play audio. The file may not be accessible or the URL is invalid.');
                    setTimeout(() => setError(''), 3000);
                }
                setPlayingTrack(null);
                setAudioElement(null);
            });
            
            setPlayingTrack(track.id);
            setAudioElement(audio);
        } catch (err) {
            setPlayingTrack(null);
            setAudioElement(null);
        }
    }, [audioElement, playingTrack, cleanupAudio]);

    const handleFileUpload = async (event, fieldName) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('audio/')) {
            setError('Please upload an audio file');
            setTimeout(() => setError(''), 3000);
            return;
        }

        setIsUploading(true);
        setUploadProgress(`Uploading ${fieldName}...`);
        setError('');

        try {
            const { file_url } = await UploadFile({ file });
            setFormData({ ...formData, [fieldName]: file_url });
            setUploadProgress('');
            setSuccess(`${fieldName} uploaded successfully!`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(`Failed to upload ${fieldName}`);
        } finally {
            setIsUploading(false);
            event.target.value = '';
        }
    };

    const handleTestUrl = async (url) => {
        if (!url) {
            setError('Please enter a URL to test');
            setTimeout(() => setError(''), 3000);
            return;
        }

        setIsTestingUrl(true);
        setError('');
        setSuccess('');

        try {
            const testAudio = new Audio(url);
            testAudio.volume = 0.01;
            
            const loadPromise = new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    testAudio.pause();
                    testAudio.src = '';
                    reject(new Error('Test timeout: The file is taking too long to load. It may not exist or be inaccessible.'));
                }, 8000);

                testAudio.addEventListener('canplaythrough', () => {
                    clearTimeout(timeoutId);
                    testAudio.pause();
                    testAudio.src = '';
                    resolve();
                }, { once: true });
                
                testAudio.addEventListener('error', (e) => {
                    clearTimeout(timeoutId);
                    const errorType = testAudio.error?.code;
                    let errorMsg = '';
                    if (errorType === 2) {
                        errorMsg = 'Cannot reach the file. Check the URL and your internet connection.';
                    } else if (errorType === 3) {
                        errorMsg = 'Invalid audio format or corrupted file.';
                    } else if (errorType === 4) {
                        errorMsg = 'File not found. The URL is invalid, the file does not exist, or you need a direct link to the audio file (not a webpage).';
                    } else {
                        errorMsg = 'Cannot load audio file. Make sure the URL is a direct link to an audio file (.mp3, .wav, .ogg, etc.).';
                    }
                    reject(new Error(errorMsg));
                }, { once: true });
            });

            testAudio.src = url;
            testAudio.load();
            
            await loadPromise;
            setSuccess('✓ Audio file is valid and ready to use!');
            setTimeout(() => setSuccess(''), 5000);
            
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(''), 5000);
        } finally {
            setIsTestingUrl(false);
        }
    };

    const handlePreviewFormAudio = () => {
        if (!formData.file_url && !formData.preview_url) {
            setError('Please upload an audio file first');
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (isPlayingPreview && audioElement) {
            cleanupAudio();
            return;
        }

        if (audioElement) {
            try {
                audioElement.pause();
                audioElement.src = '';
            } catch (e) {
                // Silently ignore
            }
            setAudioElement(null);
        }

        const audioUrl = formData.preview_url || formData.file_url;

        try {
            const audio = new Audio(audioUrl);
            audio.volume = 0.5;
            
            audio.addEventListener('error', (e) => {
                const errorType = audio.error?.code;
                if (errorType === 1) return;
                
                let errorMsg = '';
                if (errorType === 4) {
                    errorMsg = 'File not found: The URL is invalid, the file does not exist, or you need a direct link to the audio file.';
                } else if (errorType === 2) {
                    errorMsg = 'Network error: Cannot reach the file.';
                } else if (errorType === 3) {
                    errorMsg = 'The audio file format is not supported or is corrupted.';
                } else {
                    errorMsg = 'Cannot play audio. Make sure the URL is a direct link to an audio file (.mp3, .wav, .ogg, etc.).';
                }
                
                setError(errorMsg);
                setTimeout(() => setError(''), 5000);
                setAudioElement(null);
                setIsPlayingPreview(false);
            }, { once: true });
            
            audio.addEventListener('ended', () => {
                setAudioElement(null);
                setIsPlayingPreview(false);
            }, { once: true });
            
            audio.play().catch(err => {
                if (!err.message.includes('aborted') && !err.message.includes('interrupted')) {
                    setError('Cannot play audio. The URL may be invalid or the file is inaccessible.');
                    setTimeout(() => setError(''), 3000);
                }
                setAudioElement(null);
                setIsPlayingPreview(false);
            });
            
            setIsPlayingPreview(true);
            setAudioElement(audio);
        } catch (err) {
            setAudioElement(null);
            setIsPlayingPreview(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.title || !formData.file_url) {
            setError('Title and audio file URL are required');
            setTimeout(() => setError(''), 3000);
            return;
        }

        try {
            if (editingTrack) {
                await MusicTrack.update(editingTrack.id, formData);
                setSuccess('Track updated successfully!');
            } else {
                await MusicTrack.create(formData);
                setSuccess('Track added successfully!');
            }
            
            setTimeout(() => setSuccess(''), 3000);
            setShowAddForm(false);
            setEditingTrack(null);
            setFormData({
                title: '',
                artist: '',
                genre: 'cinematic',
                mood: 'epic',
                duration: 180,
                file_url: '',
                preview_url: '',
                is_active: true
            });
            loadTracks();
        } catch (err) {
            setError('Failed to save track');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleEdit = (track) => {
        setEditingTrack(track);
        setFormData({
            title: track.title,
            artist: track.artist || '',
            genre: track.genre,
            mood: track.mood,
            duration: track.duration,
            file_url: track.file_url,
            preview_url: track.preview_url || '',
            is_active: track.is_active
        });
        setShowAddForm(true);
    };

    const handleDelete = async (trackId) => {
        if (!window.confirm('Are you sure you want to delete this track?')) return;

        try {
            await MusicTrack.delete(trackId);
            setSuccess('Track deleted successfully!');
            setTimeout(() => setSuccess(''), 3000);
            loadTracks();
        } catch (err) {
            setError('Failed to delete track');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleStopAll = () => {
        cleanupAudio();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-100 p-6">
            <div className="container mx-auto max-w-7xl">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-4xl font-bold text-slate-900 mb-2">
                                <Music className="inline-block w-8 h-8 mr-3 text-purple-500" />
                                Music Library
                            </h1>
                            <p className="text-slate-600">Manage your background music tracks</p>
                        </div>
                        <div className="flex gap-3">
                            {playingTrack && (
                                <Button
                                    onClick={handleStopAll}
                                    variant="outline"
                                    className="border-red-500 text-red-600 hover:bg-red-50"
                                >
                                    <Pause className="w-4 h-4 mr-2" />
                                    Stop Playing
                                </Button>
                            )}
                            <Button
                                onClick={() => {
                                    setShowAddForm(true);
                                    setEditingTrack(null);
                                    setFormData({
                                        title: '',
                                        artist: '',
                                        genre: 'cinematic',
                                        mood: 'epic',
                                        duration: 180,
                                        file_url: '',
                                        preview_url: '',
                                        is_active: true
                                    });
                                }}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add New Track
                            </Button>
                        </div>
                    </div>
                </motion.div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-4"
                        >
                            <Alert className="border-red-500 bg-red-50">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <AlertDescription className="text-red-700">
                                    {error}
                                </AlertDescription>
                            </Alert>
                        </motion.div>
                    )}
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-4"
                        >
                            <Alert className="border-green-500 bg-green-50">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <AlertDescription className="text-green-700">
                                    {success}
                                </AlertDescription>
                            </Alert>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showAddForm && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="mb-8"
                        >
                            <Card className="bg-white/80 backdrop-blur-sm shadow-xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span>{editingTrack ? 'Edit Track' : 'Add New Track'}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                setShowAddForm(false);
                                                setEditingTrack(null);
                                            }}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">
                                                    Track Title *
                                                </label>
                                                <Input
                                                    value={formData.title}
                                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                    placeholder="Enter track title"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium mb-2">
                                                    Artist
                                                </label>
                                                <Input
                                                    value={formData.artist}
                                                    onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                                                    placeholder="Enter artist name"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium mb-2">
                                                    Genre *
                                                </label>
                                                <Select
                                                    value={formData.genre}
                                                    onValueChange={(value) => setFormData({ ...formData, genre: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="cinematic">Cinematic</SelectItem>
                                                        <SelectItem value="upbeat">Upbeat</SelectItem>
                                                        <SelectItem value="ambient">Ambient</SelectItem>
                                                        <SelectItem value="dramatic">Dramatic</SelectItem>
                                                        <SelectItem value="corporate">Corporate</SelectItem>
                                                        <SelectItem value="inspiring">Inspiring</SelectItem>
                                                        <SelectItem value="calm">Calm</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium mb-2">
                                                    Mood *
                                                </label>
                                                <Select
                                                    value={formData.mood}
                                                    onValueChange={(value) => setFormData({ ...formData, mood: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="happy">Happy</SelectItem>
                                                        <SelectItem value="sad">Sad</SelectItem>
                                                        <SelectItem value="energetic">Energetic</SelectItem>
                                                        <SelectItem value="peaceful">Peaceful</SelectItem>
                                                        <SelectItem value="epic">Epic</SelectItem>
                                                        <SelectItem value="mysterious">Mysterious</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium mb-2">
                                                    Duration (seconds)
                                                </label>
                                                <Input
                                                    type="number"
                                                    value={formData.duration}
                                                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                                                    placeholder="180"
                                                    min="1"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">
                                                    Audio File URL * 
                                                </label>
                                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-2">
                                                    <p className="text-xs text-blue-800 mb-1">
                                                        <strong>Important:</strong> Must be a <strong>direct link</strong> to an audio file
                                                    </p>
                                                    <p className="text-xs text-blue-700">
                                                        ✓ Good: https://example.com/audio.mp3<br/>
                                                        ✗ Bad: https://example.com/page-with-player
                                                    </p>
                                                    <p className="text-xs text-blue-700 mt-1">
                                                        Supported formats: .mp3, .wav, .ogg, .m4a
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={formData.file_url}
                                                        onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                                                        placeholder="https://example.com/audio.mp3"
                                                        required
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => handleTestUrl(formData.file_url)}
                                                        disabled={!formData.file_url || isTestingUrl}
                                                        className="whitespace-nowrap"
                                                    >
                                                        {isTestingUrl ? (
                                                            <>
                                                                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2" />
                                                                Testing...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Volume2 className="w-4 h-4 mr-2" />
                                                                Test URL
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Or upload a file from your computer:
                                                </p>
                                                <input
                                                    type="file"
                                                    accept="audio/*"
                                                    onChange={(e) => handleFileUpload(e, 'file_url')}
                                                    className="mt-1 text-sm"
                                                    disabled={isUploading}
                                                />
                                                {uploadProgress && (
                                                    <p className="text-xs text-blue-600 mt-1">{uploadProgress}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium mb-2">
                                                    Preview URL (optional)
                                                    <span className="text-xs text-gray-500 ml-2">
                                                        - Shorter version for quick preview
                                                    </span>
                                                </label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={formData.preview_url}
                                                        onChange={(e) => setFormData({ ...formData, preview_url: e.target.value })}
                                                        placeholder="https://example.com/preview.mp3"
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => handleTestUrl(formData.preview_url)}
                                                        disabled={!formData.preview_url || isTestingUrl}
                                                        className="whitespace-nowrap"
                                                    >
                                                        {isTestingUrl ? 'Testing...' : 'Test URL'}
                                                    </Button>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Or upload a preview file:
                                                </p>
                                                <input
                                                    type="file"
                                                    accept="audio/*"
                                                    onChange={(e) => handleFileUpload(e, 'preview_url')}
                                                    className="mt-1 text-sm"
                                                    disabled={isUploading}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-4">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handlePreviewFormAudio}
                                                disabled={(!formData.file_url && !formData.preview_url) || isUploading}
                                                className="flex-1"
                                            >
                                                {isPlayingPreview ? (
                                                    <>
                                                        <Pause className="w-4 h-4 mr-2" />
                                                        Stop Preview
                                                    </>
                                                ) : (
                                                    <>
                                                        <Play className="w-4 h-4 mr-2" />
                                                        Preview Audio
                                                    </>
                                                )}
                                            </Button>

                                            <Button
                                                type="submit"
                                                disabled={isUploading}
                                                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                            >
                                                <Save className="w-4 h-4 mr-2" />
                                                {editingTrack ? 'Update Track' : 'Save Track'}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                <Card className="bg-white/80 backdrop-blur-sm shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>All Tracks ({tracks.length})</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-12">
                                <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-gray-600">Loading tracks...</p>
                            </div>
                        ) : tracks.length === 0 ? (
                            <div className="text-center py-12">
                                <Music className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-600 mb-2">No music tracks yet</p>
                                <p className="text-sm text-gray-500">Click "Add New Track" to get started</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {tracks.map((track) => (
                                    <motion.div
                                        key={track.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-center gap-4">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handlePlay(track)}
                                                className={`flex-shrink-0 h-12 w-12 rounded-full ${
                                                    playingTrack === track.id 
                                                        ? 'bg-purple-500 hover:bg-purple-600 text-white' 
                                                        : 'bg-gray-100 hover:bg-gray-200'
                                                }`}
                                            >
                                                {playingTrack === track.id ? (
                                                    <Pause className="w-5 h-5" />
                                                ) : (
                                                    <Play className="w-5 h-5 ml-0.5" />
                                                )}
                                            </Button>

                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-semibold text-gray-900 truncate">
                                                    {track.title}
                                                </h3>
                                                <p className="text-sm text-gray-500 truncate">
                                                    {track.artist || 'Unknown Artist'} • {track.duration}s
                                                </p>
                                                <div className="flex gap-2 mt-2">
                                                    <Badge variant="outline" className="text-xs">
                                                        {track.genre}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-xs">
                                                        {track.mood}
                                                    </Badge>
                                                    {!track.is_active && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Inactive
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-2 flex-shrink-0">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(track)}
                                                    className="text-blue-600 hover:bg-blue-50"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(track.id)}
                                                    className="text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}