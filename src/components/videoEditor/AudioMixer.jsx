import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Music, Mic, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AudioMixer({ audioTracks, setAudioTracks }) {
    const voiceoverInputRef = useRef(null);
    const bgMusicInputRef = useRef(null);
    
    const handleAudioUpload = async (event, trackType) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('audio/')) {
            try {
                const { file_url } = await base44.integrations.Core.UploadFile({ file });
                setAudioTracks(prev => ({
                    ...prev,
                    [trackType]: { ...prev[trackType], url: file_url }
                }));
            } catch (err) {
                console.error('Failed to upload audio:', err);
            }
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Music className="w-5 h-5" />
                    Audio Mixer
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <Label className="mb-3 flex items-center gap-2">
                        <Mic className="w-4 h-4" />
                        Voiceover Track
                    </Label>
                    <Button
                        variant="outline"
                        onClick={() => voiceoverInputRef.current?.click()}
                        className="w-full mb-3"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        {audioTracks.voiceover.url ? 'Change Voiceover' : 'Upload Voiceover'}
                    </Button>
                    <input
                        ref={voiceoverInputRef}
                        type="file"
                        accept="audio/*"
                        onChange={(e) => handleAudioUpload(e, 'voiceover')}
                        className="hidden"
                    />
                    
                    {audioTracks.voiceover.url && (
                        <div>
                            <Label className="mb-2 flex justify-between text-sm">
                                <span>Volume</span>
                                <span className="font-normal text-gray-600">
                                    {Math.round(audioTracks.voiceover.volume * 100)}%
                                </span>
                            </Label>
                            <Slider
                                value={[audioTracks.voiceover.volume]}
                                onValueChange={([value]) => 
                                    setAudioTracks(prev => ({
                                        ...prev,
                                        voiceover: { ...prev.voiceover, volume: value }
                                    }))
                                }
                                min={0}
                                max={1}
                                step={0.05}
                            />
                        </div>
                    )}
                </div>
                
                <div className="pt-4 border-t">
                    <Label className="mb-3 flex items-center gap-2">
                        <Music className="w-4 h-4" />
                        Background Music
                    </Label>
                    <Button
                        variant="outline"
                        onClick={() => bgMusicInputRef.current?.click()}
                        className="w-full mb-3"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        {audioTracks.background.url ? 'Change Background Music' : 'Upload Background Music'}
                    </Button>
                    <input
                        ref={bgMusicInputRef}
                        type="file"
                        accept="audio/*"
                        onChange={(e) => handleAudioUpload(e, 'background')}
                        className="hidden"
                    />
                    
                    {audioTracks.background.url && (
                        <div>
                            <Label className="mb-2 flex justify-between text-sm">
                                <span>Volume</span>
                                <span className="font-normal text-gray-600">
                                    {Math.round(audioTracks.background.volume * 100)}%
                                </span>
                            </Label>
                            <Slider
                                value={[audioTracks.background.volume]}
                                onValueChange={([value]) => 
                                    setAudioTracks(prev => ({
                                        ...prev,
                                        background: { ...prev.background, volume: value }
                                    }))
                                }
                                min={0}
                                max={1}
                                step={0.05}
                            />
                        </div>
                    )}
                </div>
                
                <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600">
                        <strong>Tip:</strong> Upload separate audio files for voiceover and background music, 
                        then adjust their volumes independently for the perfect mix.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}