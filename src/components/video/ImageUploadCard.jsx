import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, GripVertical, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const SLIDE_EFFECTS = [
    { value: 'zoom-in', label: 'Zoom In' },
    { value: 'zoom-out', label: 'Zoom Out' },
    { value: 'pan-left', label: 'Pan Left' },
    { value: 'pan-right', label: 'Pan Right' },
    { value: 'fade-in', label: 'Fade In' },
    { value: 'fade-out', label: 'Fade Out' }
];

export default function ImageUploadCard({ image, index, onUpdate, onRemove, isDragging }) {
    const [localData, setLocalData] = useState({
        duration: image.duration || 5,
        dialogue: image.dialogue || '',
        effect: image.effect || 'zoom-in'
    });

    const handleUpdate = (field, value) => {
        const updated = { ...localData, [field]: value };
        setLocalData(updated);
        onUpdate(index, updated);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`${isDragging ? 'opacity-50' : ''}`}
        >
            <Card className="bg-white/80 backdrop-blur-sm border-gray-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                    <div className="flex gap-4">
                        {/* Drag Handle */}
                        <div className="flex items-start pt-2 cursor-move">
                            <GripVertical className="w-5 h-5 text-gray-400" />
                        </div>

                        {/* Image Preview */}
                        <div className="w-32 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                            {image.url ? (
                                <img 
                                    src={image.url} 
                                    alt={`Scene ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <ImageIcon className="w-8 h-8" />
                                </div>
                            )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                                <Badge className="bg-amber-100 text-amber-700">
                                    Scene {index + 1}
                                </Badge>
                                <span className="text-xs text-gray-500">{image.name}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-600 mb-1 block">
                                        Duration (seconds)
                                    </label>
                                    <Input
                                        type="number"
                                        min="3"
                                        max="10"
                                        value={localData.duration}
                                        onChange={(e) => handleUpdate('duration', parseInt(e.target.value) || 5)}
                                        className="h-8 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-gray-600 mb-1 block">
                                        Effect
                                    </label>
                                    <Select
                                        value={localData.effect}
                                        onValueChange={(value) => handleUpdate('effect', value)}
                                    >
                                        <SelectTrigger className="h-8 text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SLIDE_EFFECTS.map(effect => (
                                                <SelectItem key={effect.value} value={effect.value}>
                                                    {effect.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-600 mb-1 block">
                                    Dialogue / Narration (optional)
                                </label>
                                <Textarea
                                    placeholder="Add voiceover text for this scene..."
                                    value={localData.dialogue}
                                    onChange={(e) => handleUpdate('dialogue', e.target.value)}
                                    className="h-16 text-sm resize-none"
                                />
                            </div>
                        </div>

                        {/* Remove Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRemove(index)}
                            className="flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}