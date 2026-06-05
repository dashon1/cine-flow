import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Save } from "lucide-react";

export default function TemplateCreator({ onSave }) {
    const [formData, setFormData] = useState({
        template_name: '',
        category: 'corporate',
        description: '',
        scene_count: 8,
        avg_duration: 60,
        prompt_template: '',
        is_premium: false,
        default_settings: {
            aspect_ratio: '16:9',
            resolution: '1080p'
        }
    });

    const handleSave = async () => {
        try {
            const newTemplate = await base44.entities.VideoTemplate.create(formData);
            if (onSave) onSave(newTemplate);
            
            // Reset form
            setFormData({
                template_name: '',
                category: 'corporate',
                description: '',
                scene_count: 8,
                avg_duration: 60,
                prompt_template: '',
                is_premium: false,
                default_settings: { aspect_ratio: '16:9', resolution: '1080p' }
            });
        } catch (err) {
            console.error('Error saving template:', err);
            alert('Failed to save template');
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-purple-500" />
                    Create New Template
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label>Template Name</Label>
                    <Input
                        value={formData.template_name}
                        onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                        placeholder="Modern Corporate Video"
                    />
                </div>

                <div>
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="corporate">Corporate</SelectItem>
                            <SelectItem value="social_media">Social Media</SelectItem>
                            <SelectItem value="education">Education</SelectItem>
                            <SelectItem value="advertising">Advertising</SelectItem>
                            <SelectItem value="entertainment">Entertainment</SelectItem>
                            <SelectItem value="product_demo">Product Demo</SelectItem>
                            <SelectItem value="tutorial">Tutorial</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label>Description</Label>
                    <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Perfect for professional presentations..."
                    />
                </div>

                <div>
                    <Label>Prompt Template</Label>
                    <Textarea
                        value={formData.prompt_template}
                        onChange={(e) => setFormData({ ...formData, prompt_template: e.target.value })}
                        placeholder="Use {script} and {style} as placeholders..."
                        className="font-mono text-sm"
                    />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <Label>Premium Template</Label>
                    <Switch
                        checked={formData.is_premium}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_premium: checked })}
                    />
                </div>

                <Button onClick={handleSave} className="w-full bg-gradient-to-r from-purple-500 to-indigo-500">
                    <Save className="w-4 h-4 mr-2" />
                    Save Template
                </Button>
            </CardContent>
        </Card>
    );
}