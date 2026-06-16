import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Crown, TrendingUp, Play } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

const DEFAULT_TEMPLATES = [
    { id: 'tpl-promo', title: 'Product Promo', description: 'Showcase a product with punchy scenes and a strong CTA.', category: 'marketing', style: 'dynamic', duration: 30, is_premium: false, is_active: true, thumbnail_url: null, scene_count: 4, prompt_template: 'Create a 30-second product promo video for {product}. Use high-energy visuals and a clear call to action.' },
    { id: 'tpl-story', title: 'Brand Story', description: 'Tell your brand origin story in a cinematic 60-second video.', category: 'storytelling', style: 'cinematic', duration: 60, is_premium: false, is_active: true, thumbnail_url: null, scene_count: 6, prompt_template: 'Create a brand story video for {brand}. Cover the founding moment, core values, and vision.' },
    { id: 'tpl-explainer', title: 'Explainer Video', description: 'Walk viewers through how your product or service works.', category: 'education', style: 'clean', duration: 90, is_premium: false, is_active: true, thumbnail_url: null, scene_count: 6, prompt_template: 'Create an explainer video for {product}. Describe the problem, the solution, and key features.' },
    { id: 'tpl-testimonial', title: 'Testimonial', description: 'Share a customer success story with social proof visuals.', category: 'social_proof', style: 'warm', duration: 45, is_premium: false, is_active: true, thumbnail_url: null, scene_count: 5, prompt_template: 'Create a testimonial video for {customer} using {product}. Highlight the before/after transformation.' },
    { id: 'tpl-ugc', title: 'UGC Ad', description: 'Raw, authentic ad in the style of user-generated content.', category: 'social', style: 'authentic', duration: 30, is_premium: false, is_active: true, thumbnail_url: null, scene_count: 4, prompt_template: 'Create a UGC-style video ad for {product}. Make it feel like a real person sharing their experience.' },
    { id: 'tpl-tutorial', title: 'Tutorial / How-To', description: 'Step-by-step instructional video for your audience.', category: 'education', style: 'clear', duration: 120, is_premium: false, is_active: true, thumbnail_url: null, scene_count: 8, prompt_template: 'Create a step-by-step tutorial showing how to {task}. Be clear and include tips for beginners.' },
];

export default function Templates() {
    const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [script, setScript] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadTemplates();
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);
        } catch (err) {
            console.error('User not authenticated');
        }
    };

    const loadTemplates = async () => {
        try {
            const allTemplates = await base44.entities.VideoTemplate.filter({ is_active: true });
            if (allTemplates.length > 0) setTemplates(allTemplates);
        } catch (err) {
            console.error('Error loading templates:', err);
        }
    };

    const handleUseTemplate = (template) => {
        if (template.is_premium && user?.plan_type === 'free') {
            alert('This is a premium template. Upgrade to Pro or Enterprise to use it.');
            return;
        }
        setSelectedTemplate(template);
    };

    const handleGenerate = async () => {
        if (!script.trim()) {
            alert('Please enter a script');
            return;
        }

        setIsGenerating(true);

        try {
            const { data } = await base44.functions.invoke('generateVideoFromTemplate', {
                template_id: selectedTemplate.id,
                script: script,
                language: 'en'
            });

            if (data.error) {
                throw new Error(data.error);
            }

            navigate(createPageUrl('Home') + `?project_id=${data.project_id}`);
        } catch (err) {
            console.error('Template generation error:', err);
            alert(err.message || 'Failed to generate from template');
        } finally {
            setIsGenerating(false);
        }
    };

    const getCategoryIcon = (category) => {
        const icons = {
            corporate: '💼',
            social_media: '📱',
            education: '🎓',
            advertising: '📢',
            entertainment: '🎬',
            product_demo: '🛍️',
            tutorial: '📚'
        };
        return icons[category] || '🎥';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-100 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-12 text-center">
                    <h1 className="text-5xl font-bold text-gray-900 mb-4">
                        <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Video Templates
                        </span>
                    </h1>
                    <p className="text-xl text-gray-600">
                        Start with professionally designed templates for faster video creation
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template) => (
                        <motion.div
                            key={template.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Card className="overflow-hidden hover:shadow-2xl transition-all cursor-pointer h-full" onClick={() => handleUseTemplate(template)}>
                                {template.thumbnail_url ? (
                                    <div className="h-48 overflow-hidden">
                                        <img
                                            src={template.thumbnail_url}
                                            alt={template.template_name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-48 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                                        <span className="text-6xl">{getCategoryIcon(template.category)}</span>
                                    </div>
                                )}
                                
                                <CardHeader>
                                    <div className="flex items-start justify-between gap-2">
                                        <CardTitle className="text-lg">{template.template_name}</CardTitle>
                                        {template.is_premium && (
                                            <Crown className="w-5 h-5 text-amber-500 flex-shrink-0" />
                                        )}
                                    </div>
                                    <div className="flex gap-2 mt-2 flex-wrap">
                                        <Badge variant="outline" className="text-xs">
                                            {template.category.replace('_', ' ')}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" />
                                            {template.usage_count || 0} uses
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent>
                                    <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                                    
                                    <div className="space-y-2 text-xs text-gray-500">
                                        <div className="flex justify-between">
                                            <span>Scenes:</span>
                                            <span className="font-medium">{template.scene_count || '6-8'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Duration:</span>
                                            <span className="font-medium">~{template.avg_duration || 60}s</span>
                                        </div>
                                    </div>

                                    <Button 
                                        className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleUseTemplate(template);
                                        }}
                                    >
                                        <Play className="w-4 h-4 mr-2" />
                                        Use Template
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Template Usage Dialog */}
                <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl">
                                {selectedTemplate?.template_name}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">
                            <p className="text-gray-600">{selectedTemplate?.description}</p>

                            <div>
                                <label className="block text-sm font-medium mb-2">Your Script</label>
                                <Textarea
                                    placeholder="Enter your script here..."
                                    value={script}
                                    onChange={(e) => setScript(e.target.value)}
                                    className="min-h-[200px]"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {script.length} characters
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedTemplate(null)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleGenerate}
                                    disabled={!script.trim() || isGenerating}
                                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
                                >
                                    {isGenerating ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            Generate Video
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}