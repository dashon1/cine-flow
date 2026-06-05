import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scissors, Wand2, Sparkles, Volume2, Sun } from "lucide-react";

export default function AdvancedVideoEditor({ video, onEnhance }) {
    const [enhancementSettings, setEnhancementSettings] = useState({
        brightness: 100,
        contrast: 100,
        saturation: 100,
        volume: 100,
        enhancement_type: 'quality_boost'
    });
    const [isProcessing, setIsProcessing] = useState(false);

    const handleEnhance = async () => {
        setIsProcessing(true);
        try {
            await onEnhance(enhancementSettings);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-purple-500" />
                    Advanced Editor
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="enhance">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="enhance">Enhance</TabsTrigger>
                        <TabsTrigger value="filters">Filters</TabsTrigger>
                        <TabsTrigger value="audio">Audio</TabsTrigger>
                    </TabsList>

                    <TabsContent value="enhance" className="space-y-4">
                        <div className="space-y-3">
                            <div>
                                <Label className="text-sm mb-2 block flex items-center gap-2">
                                    <Sun className="w-4 h-4" />
                                    Brightness
                                </Label>
                                <Slider
                                    value={[enhancementSettings.brightness]}
                                    onValueChange={([val]) => setEnhancementSettings({ ...enhancementSettings, brightness: val })}
                                    min={50}
                                    max={150}
                                    step={1}
                                />
                                <p className="text-xs text-gray-500 mt-1">{enhancementSettings.brightness}%</p>
                            </div>

                            <div>
                                <Label className="text-sm mb-2 block">Contrast</Label>
                                <Slider
                                    value={[enhancementSettings.contrast]}
                                    onValueChange={([val]) => setEnhancementSettings({ ...enhancementSettings, contrast: val })}
                                    min={50}
                                    max={150}
                                    step={1}
                                />
                                <p className="text-xs text-gray-500 mt-1">{enhancementSettings.contrast}%</p>
                            </div>

                            <div>
                                <Label className="text-sm mb-2 block">Saturation</Label>
                                <Slider
                                    value={[enhancementSettings.saturation]}
                                    onValueChange={([val]) => setEnhancementSettings({ ...enhancementSettings, saturation: val })}
                                    min={0}
                                    max={200}
                                    step={1}
                                />
                                <p className="text-xs text-gray-500 mt-1">{enhancementSettings.saturation}%</p>
                            </div>
                        </div>

                        <Button
                            onClick={handleEnhance}
                            disabled={isProcessing}
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                        >
                            {isProcessing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Apply Enhancements
                                </>
                            )}
                        </Button>
                    </TabsContent>

                    <TabsContent value="filters" className="space-y-3">
                        <p className="text-sm text-gray-600">Quick filter presets</p>
                        <div className="grid grid-cols-2 gap-2">
                            {['Vivid', 'Vintage', 'B&W', 'Warm', 'Cool', 'Dramatic'].map((filter) => (
                                <Button key={filter} variant="outline" size="sm">
                                    {filter}
                                </Button>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="audio" className="space-y-4">
                        <div>
                            <Label className="text-sm mb-2 block flex items-center gap-2">
                                <Volume2 className="w-4 h-4" />
                                Master Volume
                            </Label>
                            <Slider
                                value={[enhancementSettings.volume]}
                                onValueChange={([val]) => setEnhancementSettings({ ...enhancementSettings, volume: val })}
                                min={0}
                                max={200}
                                step={1}
                            />
                            <p className="text-xs text-gray-500 mt-1">{enhancementSettings.volume}%</p>
                        </div>

                        <Button variant="outline" className="w-full">
                            <Scissors className="w-4 h-4 mr-2" />
                            Trim Audio
                        </Button>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}