import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Wand2, RotateCcw } from "lucide-react";

export default function VideoFilters({ filters, setFilters }) {
    const handleReset = () => {
        setFilters({
            brightness: 100,
            contrast: 100,
            saturation: 100,
            blur: 0,
            grayscale: 0,
            sepia: 0
        });
    };
    
    const presets = [
        { name: 'Vintage', values: { brightness: 110, contrast: 90, saturation: 80, sepia: 40, blur: 0, grayscale: 0 } },
        { name: 'B&W', values: { brightness: 100, contrast: 120, saturation: 0, grayscale: 100, blur: 0, sepia: 0 } },
        { name: 'Vibrant', values: { brightness: 110, contrast: 110, saturation: 130, blur: 0, grayscale: 0, sepia: 0 } },
        { name: 'Soft', values: { brightness: 105, contrast: 90, saturation: 95, blur: 1, grayscale: 0, sepia: 0 } }
    ];
    
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Wand2 className="w-5 h-5" />
                        Filters & Effects
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleReset}
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-2 mb-4">
                    {presets.map((preset) => (
                        <Button
                            key={preset.name}
                            variant="outline"
                            size="sm"
                            onClick={() => setFilters(preset.values)}
                            className="text-xs"
                        >
                            {preset.name}
                        </Button>
                    ))}
                </div>
                
                <div>
                    <Label className="mb-2 flex justify-between">
                        <span>Brightness</span>
                        <span className="text-sm font-normal text-gray-600">{filters.brightness}%</span>
                    </Label>
                    <Slider
                        value={[filters.brightness]}
                        onValueChange={([value]) => setFilters({ ...filters, brightness: value })}
                        min={0}
                        max={200}
                        step={1}
                    />
                </div>
                
                <div>
                    <Label className="mb-2 flex justify-between">
                        <span>Contrast</span>
                        <span className="text-sm font-normal text-gray-600">{filters.contrast}%</span>
                    </Label>
                    <Slider
                        value={[filters.contrast]}
                        onValueChange={([value]) => setFilters({ ...filters, contrast: value })}
                        min={0}
                        max={200}
                        step={1}
                    />
                </div>
                
                <div>
                    <Label className="mb-2 flex justify-between">
                        <span>Saturation</span>
                        <span className="text-sm font-normal text-gray-600">{filters.saturation}%</span>
                    </Label>
                    <Slider
                        value={[filters.saturation]}
                        onValueChange={([value]) => setFilters({ ...filters, saturation: value })}
                        min={0}
                        max={200}
                        step={1}
                    />
                </div>
                
                <div>
                    <Label className="mb-2 flex justify-between">
                        <span>Blur</span>
                        <span className="text-sm font-normal text-gray-600">{filters.blur}px</span>
                    </Label>
                    <Slider
                        value={[filters.blur]}
                        onValueChange={([value]) => setFilters({ ...filters, blur: value })}
                        min={0}
                        max={10}
                        step={0.5}
                    />
                </div>
                
                <div>
                    <Label className="mb-2 flex justify-between">
                        <span>Grayscale</span>
                        <span className="text-sm font-normal text-gray-600">{filters.grayscale}%</span>
                    </Label>
                    <Slider
                        value={[filters.grayscale]}
                        onValueChange={([value]) => setFilters({ ...filters, grayscale: value })}
                        min={0}
                        max={100}
                        step={1}
                    />
                </div>
                
                <div>
                    <Label className="mb-2 flex justify-between">
                        <span>Sepia</span>
                        <span className="text-sm font-normal text-gray-600">{filters.sepia}%</span>
                    </Label>
                    <Slider
                        value={[filters.sepia]}
                        onValueChange={([value]) => setFilters({ ...filters, sepia: value })}
                        min={0}
                        max={100}
                        step={1}
                    />
                </div>
            </CardContent>
        </Card>
    );
}