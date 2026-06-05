import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Scissors, Gauge } from "lucide-react";

export default function VideoTimeline({ 
    clips, 
    setClips, 
    duration, 
    currentTime, 
    onSeek,
    playbackSpeed,
    setPlaybackSpeed
}) {
    const handleTrimStart = () => {
        if (clips.length > 0) {
            setClips(prev => prev.map((clip, idx) => 
                idx === 0 ? { ...clip, start: currentTime } : clip
            ));
        }
    };
    
    const handleTrimEnd = () => {
        if (clips.length > 0) {
            setClips(prev => prev.map((clip, idx) => 
                idx === 0 ? { ...clip, end: currentTime } : clip
            ));
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Scissors className="w-5 h-5" />
                    Timeline & Trimming
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <Label className="mb-3 block">Timeline</Label>
                    <div className="relative h-16 bg-gray-100 rounded-lg overflow-hidden">
                        {clips.map((clip, index) => (
                            <div
                                key={clip.id}
                                className="absolute h-full bg-purple-400 border-2 border-purple-600"
                                style={{
                                    left: `${(clip.start / duration) * 100}%`,
                                    width: `${((clip.end - clip.start) / duration) * 100}%`
                                }}
                            >
                                <div className="h-full flex items-center justify-center text-xs text-white font-medium">
                                    Clip {index + 1}
                                </div>
                            </div>
                        ))}
                        <div
                            className="absolute top-0 bottom-0 w-0.5 bg-red-500"
                            style={{ left: `${(currentTime / duration) * 100}%` }}
                        />
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <Button
                        variant="outline"
                        onClick={handleTrimStart}
                        className="w-full"
                    >
                        <Scissors className="w-4 h-4 mr-2" />
                        Trim Start Here
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleTrimEnd}
                        className="w-full"
                    >
                        <Scissors className="w-4 h-4 mr-2" />
                        Trim End Here
                    </Button>
                </div>
                
                <div>
                    <Label className="mb-3 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Gauge className="w-4 h-4" />
                            Playback Speed
                        </span>
                        <span className="text-sm font-normal text-gray-600">{playbackSpeed}x</span>
                    </Label>
                    <Slider
                        value={[playbackSpeed]}
                        onValueChange={([value]) => setPlaybackSpeed(value)}
                        min={0.25}
                        max={2.0}
                        step={0.25}
                        className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0.25x</span>
                        <span>1x</span>
                        <span>2x</span>
                    </div>
                </div>
                
                {clips.length > 0 && (
                    <div className="text-sm text-gray-600 space-y-1">
                        <p>Start: {clips[0].start.toFixed(2)}s</p>
                        <p>End: {clips[0].end.toFixed(2)}s</p>
                        <p>Duration: {(clips[0].end - clips[0].start).toFixed(2)}s</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}