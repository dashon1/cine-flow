import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit2, Check, X, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

export default function StoryboardEditor({ storyboard, onUpdate, onGenerate }) {
    const [editingScene, setEditingScene] = useState(null);
    const [scenes, setScenes] = useState(storyboard?.scenes || []);

    const handleEdit = (index) => {
        setEditingScene(index);
    };

    const handleSave = (index) => {
        onUpdate({ ...storyboard, scenes });
        setEditingScene(null);
    };

    const handleCancel = (index) => {
        setScenes(storyboard.scenes);
        setEditingScene(null);
    };

    const handleChange = (index, field, value) => {
        const updated = [...scenes];
        updated[index] = { ...updated[index], [field]: value };
        setScenes(updated);
    };

    const handleDelete = (index) => {
        const updated = scenes.filter((_, i) => i !== index);
        setScenes(updated.map((scene, idx) => ({ ...scene, scene_number: idx + 1 })));
        onUpdate({ ...storyboard, scenes: updated });
    };

    const handleAddScene = () => {
        const newScene = {
            scene_number: scenes.length + 1,
            duration: 5,
            visual_description: "",
            dialogue: "",
            camera_angle: "Medium shot",
            mood: "Neutral",
            effect: "fade-in"
        };
        const updated = [...scenes, newScene];
        setScenes(updated);
        setEditingScene(updated.length - 1);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Edit Storyboard</h3>
                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddScene}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Scene
                    </Button>
                    <Button
                        onClick={() => onGenerate(storyboard)}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                        size="sm"
                    >
                        Generate Images
                    </Button>
                </div>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {scenes.map((scene, index) => (
                    <motion.div
                        key={scene.scene_number}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="bg-white/80 backdrop-blur-sm border-gray-200">
                            <CardContent className="p-4">
                                {editingScene === index ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Badge className="bg-amber-100 text-amber-700">
                                                Scene {scene.scene_number}
                                            </Badge>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleSave(index)}
                                                    className="h-7 text-green-600 hover:bg-green-50"
                                                >
                                                    <Check className="w-4 h-4 mr-1" />
                                                    Save
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleCancel(index)}
                                                    className="h-7 text-gray-600 hover:bg-gray-50"
                                                >
                                                    <X className="w-4 h-4 mr-1" />
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs text-gray-600 mb-1 block">Duration (seconds)</label>
                                                <Input
                                                    type="number"
                                                    min="3"
                                                    max="10"
                                                    value={scene.duration}
                                                    onChange={(e) => handleChange(index, 'duration', parseInt(e.target.value))}
                                                    className="h-8"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-600 mb-1 block">Mood</label>
                                                <Input
                                                    value={scene.mood}
                                                    onChange={(e) => handleChange(index, 'mood', e.target.value)}
                                                    className="h-8"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs text-gray-600 mb-1 block">Visual Description</label>
                                            <Textarea
                                                value={scene.visual_description}
                                                onChange={(e) => handleChange(index, 'visual_description', e.target.value)}
                                                className="h-20 text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs text-gray-600 mb-1 block">Dialogue / Narration</label>
                                            <Textarea
                                                value={scene.dialogue}
                                                onChange={(e) => handleChange(index, 'dialogue', e.target.value)}
                                                className="h-16 text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs text-gray-600 mb-1 block">Camera Angle</label>
                                            <Input
                                                value={scene.camera_angle}
                                                onChange={(e) => handleChange(index, 'camera_angle', e.target.value)}
                                                className="h-8"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex flex-col sm:flex-row items-start justify-between gap-2 mb-3">
                                            <Badge className="bg-amber-100 text-amber-700 flex-shrink-0">
                                                Scene {scene.scene_number} ({scene.duration}s)
                                            </Badge>
                                            <div className="flex gap-1 flex-shrink-0">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleEdit(index)}
                                                    className="h-7 text-blue-600 hover:bg-blue-50"
                                                >
                                                    <Edit2 className="w-3 h-3 mr-1" />
                                                    <span className="hidden sm:inline">Edit</span>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDelete(index)}
                                                    className="h-7 text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-xs text-gray-500 line-clamp-2">{scene.visual_description}</p>
                                            {scene.dialogue && (
                                                <p className="text-sm text-gray-700 italic line-clamp-2">"{scene.dialogue}"</p>
                                            )}
                                            <div className="flex gap-2 flex-wrap">
                                                <Badge variant="outline" className="text-xs">{scene.mood}</Badge>
                                                <Badge variant="outline" className="text-xs">{scene.camera_angle}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}