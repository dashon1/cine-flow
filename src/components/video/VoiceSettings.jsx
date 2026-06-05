
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Mic, Music2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge"; // Import Badge component

export default function VoiceSettings({ settings, onUpdate, availableTTSModels = [], availableModels: legacyModels, userTier }) {
    const models = availableTTSModels.length > 0 ? availableTTSModels : (legacyModels || []);
    return (
        <Card className="bg-white/60 backdrop-blur-sm border-gray-200">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Mic className="w-5 h-5 text-amber-500" />
                    Voice & Audio Settings
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Voice Model Selection */}
                {models.length > 1 && (
                    <div>
                        <Label className="text-sm mb-2 block">Voice Model</Label>
                        <Select
                            value={settings.selected_voice_model}
                            onValueChange={(value) => onUpdate({ ...settings, selected_voice_model: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select voice model..." />
                            </SelectTrigger>
                            <SelectContent>
                                {models.map((model) => (
                                    <SelectItem key={model.id} value={model.id}>
                                        <div className="flex items-center gap-2">
                                            <span>{model.model_name}</span>
                                            <Badge variant="outline" className="text-xs">
                                                {model.provider}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">
                            ElevenLabs models provide professional, natural-sounding voices
                        </p>
                    </div>
                )}

                {/* Voice Quality Notice */}
                <Alert className="border-blue-500 bg-blue-50">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">About Voice Quality</p>
                        <p className="text-xs leading-relaxed">
                            {settings.selected_voice_model && models.find(m => m.id === settings.selected_voice_model)?.provider === 'elevenlabs' ? (
                                <strong>Using ElevenLabs AI voices for professional, human-like narration.</strong>
                            ) : (
                                <>
                                    Currently using browser text-to-speech (varies by browser).
                                    <strong> Chrome/Edge have the best quality.</strong>
                                    Upgrade to Pro for professional AI voices (ElevenLabs).
                                </>
                            )}
                        </p>
                    </AlertDescription>
                </Alert>

                <div>
                    <Label className="text-sm mb-2 block">Voice Type</Label>
                    <Select
                        value={settings.voice_type || 'default'}
                        onValueChange={(value) => onUpdate({ ...settings, voice_type: value })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="default">Default Voice</SelectItem>
                            <SelectItem value="male">Male Voice</SelectItem>
                            <SelectItem value="female">Female Voice</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                        Note: Voice selection depends on your browser's available voices
                    </p>
                </div>

                <div>
                    <Label className="text-sm mb-2 block flex items-center justify-between">
                        <span>Voice Speed</span>
                        <span className="text-xs text-gray-500">{settings.voice_speed || 1.0}x</span>
                    </Label>
                    <Slider
                        value={[settings.voice_speed || 1.0]}
                        onValueChange={([value]) => onUpdate({ ...settings, voice_speed: value })}
                        min={0.5}
                        max={2.0}
                        step={0.1}
                        className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Slow (0.5x)</span>
                        <span>Fast (2.0x)</span>
                    </div>
                </div>

                <div>
                    <Label className="text-sm mb-2 block flex items-center justify-between">
                        <span>Voice Pitch</span>
                        <span className="text-xs text-gray-500">{settings.voice_pitch || 1.0}x</span>
                    </Label>
                    <Slider
                        value={[settings.voice_pitch || 1.0]}
                        onValueChange={([value]) => onUpdate({ ...settings, voice_pitch: value })}
                        min={0.5}
                        max={2.0}
                        step={0.1}
                        className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Low (0.5x)</span>
                        <span>High (2.0x)</span>
                    </div>
                </div>

                <div>
                    <Label className="text-sm mb-2 block flex items-center justify-between">
                        <span className="flex items-center gap-1">
                            <Music2 className="w-4 h-4" />
                            Music Volume
                        </span>
                        <span className="text-xs text-gray-500">{Math.round((settings.music_volume || 0.3) * 100)}%</span>
                    </Label>
                    <Slider
                        value={[settings.music_volume || 0.3]}
                        onValueChange={([value]) => onUpdate({ ...settings, music_volume: value })}
                        min={0}
                        max={1}
                        step={0.05}
                        className="w-full"
                    />
                </div>
            </CardContent>
        </Card>
    );
}
