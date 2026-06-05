import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Type, Plus, Trash2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";

export default function TextOverlayEditor({ textOverlays, setTextOverlays, currentTime, duration }) {
    const [newText, setNewText] = useState({
        text: '',
        x: 640,
        y: 360,
        fontSize: 48,
        fontFamily: 'Arial',
        color: '#ffffff',
        strokeColor: '#000000',
        strokeWidth: 2,
        align: 'center',
        startTime: 0,
        endTime: 5
    });
    
    const handleAddText = () => {
        if (newText.text.trim()) {
            setTextOverlays([...textOverlays, {
                ...newText,
                id: Date.now(),
                startTime: currentTime,
                endTime: Math.min(currentTime + 5, duration)
            }]);
            setNewText({ ...newText, text: '' });
        }
    };
    
    const handleRemoveText = (id) => {
        setTextOverlays(textOverlays.filter(overlay => overlay.id !== id));
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Type className="w-5 h-5" />
                    Text Overlays
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label className="mb-2 block">Text Content</Label>
                    <div className="flex gap-2">
                        <Input
                            value={newText.text}
                            onChange={(e) => setNewText({ ...newText, text: e.target.value })}
                            placeholder="Enter text..."
                            className="flex-1"
                        />
                        <Button onClick={handleAddText}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label className="mb-2 block text-sm">Font Size</Label>
                        <Slider
                            value={[newText.fontSize]}
                            onValueChange={([value]) => setNewText({ ...newText, fontSize: value })}
                            min={12}
                            max={120}
                            step={1}
                        />
                        <span className="text-xs text-gray-500">{newText.fontSize}px</span>
                    </div>
                    
                    <div>
                        <Label className="mb-2 block text-sm">Font Family</Label>
                        <Select
                            value={newText.fontFamily}
                            onValueChange={(value) => setNewText({ ...newText, fontFamily: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Arial">Arial</SelectItem>
                                <SelectItem value="Helvetica">Helvetica</SelectItem>
                                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                                <SelectItem value="Courier New">Courier New</SelectItem>
                                <SelectItem value="Georgia">Georgia</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label className="mb-2 block text-sm">Text Color</Label>
                        <Input
                            type="color"
                            value={newText.color}
                            onChange={(e) => setNewText({ ...newText, color: e.target.value })}
                        />
                    </div>
                    
                    <div>
                        <Label className="mb-2 block text-sm">Stroke Color</Label>
                        <Input
                            type="color"
                            value={newText.strokeColor}
                            onChange={(e) => setNewText({ ...newText, strokeColor: e.target.value })}
                        />
                    </div>
                </div>
                
                <div>
                    <Label className="mb-2 block text-sm">Alignment</Label>
                    <Select
                        value={newText.align}
                        onValueChange={(value) => setNewText({ ...newText, align: value })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="pt-4 border-t">
                    <Label className="mb-2 block font-semibold">Active Overlays</Label>
                    {textOverlays.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No text overlays added yet</p>
                    ) : (
                        <div className="space-y-2">
                            {textOverlays.map((overlay) => (
                                <div
                                    key={overlay.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{overlay.text}</p>
                                        <p className="text-xs text-gray-500">
                                            {overlay.startTime.toFixed(1)}s - {overlay.endTime.toFixed(1)}s
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveText(overlay.id)}
                                    >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}