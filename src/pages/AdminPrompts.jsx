import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { Settings, Plus, Edit2, Save, X, Copy, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PromptTester from '../components/admin/PromptTester';

const PROMPT_TYPES = [
    { value: 'storyboard_generation', label: 'Storyboard Generation' },
    { value: 'image_generation', label: 'Image Generation' },
    { value: 'voiceover_optimization', label: 'Voiceover Optimization' }
];

export default function AdminPrompts() {
    const [prompts, setPrompts] = useState([]);
    const [selectedPrompt, setSelectedPrompt] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showTester, setShowTester] = useState(false);

    const [formData, setFormData] = useState({
        prompt_type: 'storyboard_generation',
        prompt_name: '',
        prompt_template: '',
        description: '',
        variables: [],
        is_active: true
    });

    useEffect(() => {
        loadPrompts();
    }, []);

    const loadPrompts = async () => {
        setIsLoading(true);
        setError('');
        try {
            const allPrompts = await base44.entities.SystemPrompt.list('-updated_date');
            setPrompts(allPrompts);
        } catch (err) {
            console.error('Error loading prompts:', err);
            setError('Failed to load prompts. Please refresh the page.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectPrompt = (prompt) => {
        setSelectedPrompt(prompt);
        setFormData({
            prompt_type: prompt.prompt_type,
            prompt_name: prompt.prompt_name,
            prompt_template: prompt.prompt_template,
            description: prompt.description || '',
            variables: prompt.variables || [],
            is_active: prompt.is_active
        });
        setIsEditing(false);
        setIsCreating(false);
    };

    const handleCreateNew = () => {
        setSelectedPrompt(null);
        setFormData({
            prompt_type: 'storyboard_generation',
            prompt_name: '',
            prompt_template: '',
            description: '',
            variables: [],
            is_active: true
        });
        setIsCreating(true);
        setIsEditing(true);
    };

    const handleEdit = () => {
        setIsEditing(true);
        setIsCreating(false);
    };

    const handleCancel = () => {
        if (selectedPrompt) {
            setFormData({
                prompt_type: selectedPrompt.prompt_type,
                prompt_name: selectedPrompt.prompt_name,
                prompt_template: selectedPrompt.prompt_template,
                description: selectedPrompt.description || '',
                variables: selectedPrompt.variables || [],
                is_active: selectedPrompt.is_active
            });
        }
        setIsEditing(false);
        setIsCreating(false);
    };

    const extractVariables = (template) => {
        const regex = /\{([^}]+)\}/g;
        const matches = template.matchAll(regex);
        const vars = new Set();
        for (const match of matches) {
            vars.add(match[1]);
        }
        return Array.from(vars);
    };

    const handleSave = async () => {
        setError('');
        setSuccess('');

        if (!formData.prompt_name.trim() || !formData.prompt_template.trim()) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            const variables = extractVariables(formData.prompt_template);
            const dataToSave = {
                ...formData,
                variables
            };

            if (isCreating) {
                const newPrompt = await base44.entities.SystemPrompt.create(dataToSave);
                setSelectedPrompt(newPrompt);
                setSuccess('Prompt created successfully!');
            } else if (selectedPrompt) {
                const updatedPrompt = await base44.entities.SystemPrompt.update(selectedPrompt.id, dataToSave);
                setSelectedPrompt(updatedPrompt);
                setSuccess('Prompt updated successfully!');
            }

            setIsEditing(false);
            setIsCreating(false);
            await loadPrompts();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error saving prompt:', err);
            setError('Failed to save prompt. Please try again.');
        }
    };

    const handleCopy = async (prompt) => {
        setFormData({
            prompt_type: prompt.prompt_type,
            prompt_name: `${prompt.prompt_name} (Copy)`,
            prompt_template: prompt.prompt_template,
            description: prompt.description || '',
            variables: prompt.variables || [],
            is_active: false
        });
        setSelectedPrompt(null);
        setIsCreating(true);
        setIsEditing(true);
    };

    const handleToggleActive = async (prompt) => {
        try {
            // Deactivate all other prompts of the same type
            const sameTypePrompts = prompts.filter(p => p.prompt_type === prompt.prompt_type && p.id !== prompt.id);
            for (const p of sameTypePrompts) {
                if (p.is_active) {
                    await base44.entities.SystemPrompt.update(p.id, { is_active: false });
                }
            }

            // Activate this prompt
            const updated = await base44.entities.SystemPrompt.update(prompt.id, { is_active: !prompt.is_active });
            setSuccess(`Prompt ${updated.is_active ? 'activated' : 'deactivated'} successfully!`);
            await loadPrompts();
            if (selectedPrompt && selectedPrompt.id === prompt.id) {
                setSelectedPrompt(updated);
            }
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error toggling prompt:', err);
            setError('Failed to toggle prompt status.');
        }
    };

    const groupedPrompts = PROMPT_TYPES.reduce((acc, type) => {
        acc[type.value] = prompts.filter(p => p.prompt_type === type.value);
        return acc;
    }, {});

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-center items-center min-h-[400px]">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-amber-400 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-gray-600">Loading prompts...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <Settings className="w-8 h-8 text-amber-500" />
                            AI Prompt Control Panel
                        </h1>
                        <p className="text-slate-600 mt-2">Manage and optimize AI prompts for video generation</p>
                    </div>
                    <Button
                        onClick={handleCreateNew}
                        className="bg-gradient-to-r from-amber-500 to-orange-500"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Prompt
                    </Button>
                </div>

                {error && (
                    <Alert className="mb-6 border-red-500 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-700">{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="mb-6 border-green-500 bg-green-50">
                        <AlertDescription className="text-green-700">{success}</AlertDescription>
                    </Alert>
                )}

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Prompt Library */}
                    <Card className="bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Prompt Library</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 max-h-[600px] overflow-y-auto">
                                {PROMPT_TYPES.map((type) => (
                                    <div key={type.value}>
                                        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            {type.label}
                                            <Badge variant="outline" className="text-xs">
                                                {groupedPrompts[type.value]?.length || 0}
                                            </Badge>
                                        </h3>
                                        <div className="space-y-2">
                                            {groupedPrompts[type.value]?.map((prompt) => (
                                                <div
                                                    key={prompt.id}
                                                    className={`
                                                        p-3 rounded-lg border cursor-pointer transition-all
                                                        ${selectedPrompt?.id === prompt.id
                                                            ? 'border-amber-400 bg-amber-50'
                                                            : 'border-gray-200 bg-white hover:border-amber-300'
                                                        }
                                                    `}
                                                    onClick={() => handleSelectPrompt(prompt)}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm font-medium text-gray-900 truncate">
                                                                {prompt.prompt_name}
                                                            </h4>
                                                            {prompt.description && (
                                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                                    {prompt.description}
                                                                </p>
                                                            )}
                                                            <div className="flex gap-2 mt-2">
                                                                {prompt.is_active && (
                                                                    <Badge className="bg-green-100 text-green-700 text-xs">
                                                                        Active
                                                                    </Badge>
                                                                )}
                                                                {prompt.variables && prompt.variables.length > 0 && (
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {prompt.variables.length} vars
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCopy(prompt);
                                                            }}
                                                            className="flex-shrink-0 h-7 w-7"
                                                        >
                                                            <Copy className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!groupedPrompts[type.value] || groupedPrompts[type.value].length === 0) && (
                                                <p className="text-sm text-gray-400 italic p-2">No prompts yet</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Prompt Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>
                                        {isCreating ? 'Create New Prompt' : selectedPrompt ? 'Prompt Details' : 'Prompt Details'}
                                    </CardTitle>
                                    {selectedPrompt && !isEditing && (
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleToggleActive(selectedPrompt)}
                                            >
                                                {selectedPrompt.is_active ? (
                                                    <>
                                                        <EyeOff className="w-4 h-4 mr-2" />
                                                        Deactivate
                                                    </>
                                                ) : (
                                                    <>
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        Activate
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleEdit}
                                            >
                                                <Edit2 className="w-4 h-4 mr-2" />
                                                Edit
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500">
                                    View prompt configuration and details
                                </p>
                            </CardHeader>
                            <CardContent>
                                {!selectedPrompt && !isCreating ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Eye className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No prompt selected</h3>
                                        <p className="text-sm text-gray-500">
                                            Select a prompt from the list or create a new one
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Prompt Type *
                                            </label>
                                            <Select
                                                value={formData.prompt_type}
                                                onValueChange={(value) => setFormData({ ...formData, prompt_type: value })}
                                                disabled={!isEditing}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {PROMPT_TYPES.map((type) => (
                                                        <SelectItem key={type.value} value={type.value}>
                                                            {type.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Prompt Name *
                                            </label>
                                            <Input
                                                value={formData.prompt_name}
                                                onChange={(e) => setFormData({ ...formData, prompt_name: e.target.value })}
                                                disabled={!isEditing}
                                                placeholder="Enter prompt name..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Description
                                            </label>
                                            <Textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                disabled={!isEditing}
                                                placeholder="Describe what this prompt does..."
                                                className="h-20"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Prompt Template *
                                            </label>
                                            <Textarea
                                                value={formData.prompt_template}
                                                onChange={(e) => setFormData({ ...formData, prompt_template: e.target.value })}
                                                disabled={!isEditing}
                                                placeholder="Enter your prompt template with {variables}..."
                                                className="h-64 font-mono text-sm"
                                            />
                                            {formData.prompt_template && (
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Variables detected: {extractVariables(formData.prompt_template).join(', ') || 'None'}
                                                </p>
                                            )}
                                        </div>

                                        {isEditing && (
                                            <div className="flex gap-3 pt-4">
                                                <Button
                                                    onClick={handleSave}
                                                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500"
                                                >
                                                    <Save className="w-4 h-4 mr-2" />
                                                    {isCreating ? 'Create Prompt' : 'Save Changes'}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={handleCancel}
                                                    className="flex-1"
                                                >
                                                    <X className="w-4 h-4 mr-2" />
                                                    Cancel
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Variable Reference */}
                        <Card className="bg-blue-50/50 border-blue-200">
                            <CardHeader>
                                <CardTitle className="text-lg">Variable Reference</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div>
                                        <h4 className="text-sm font-semibold text-blue-900 mb-2">Storyboard Generation</h4>
                                        <code className="text-xs text-blue-700 bg-blue-100 p-2 rounded block">
                                            {'{script}'} - User's input script
                                        </code>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-blue-900 mb-2">Image Generation</h4>
                                        <div className="space-y-1">
                                            <code className="text-xs text-blue-700 bg-blue-100 p-2 rounded block">
                                                {'{visual_description}'} - Scene visual description
                                            </code>
                                            <code className="text-xs text-blue-700 bg-blue-100 p-2 rounded block">
                                                {'{mood}'} - Scene mood/atmosphere
                                            </code>
                                            <code className="text-xs text-blue-700 bg-blue-100 p-2 rounded block">
                                                {'{camera_angle}'} - Camera angle suggestion
                                            </code>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-blue-900 mb-2">Voiceover Optimization</h4>
                                        <div className="space-y-1">
                                            <code className="text-xs text-blue-700 bg-blue-100 p-2 rounded block">
                                                {'{dialogue}'} - Raw dialogue text
                                            </code>
                                            <code className="text-xs text-blue-700 bg-blue-100 p-2 rounded block">
                                                {'{language}'} - Target language code
                                            </code>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Prompt Tester */}
                        {selectedPrompt && !isEditing && (
                            <Button
                                variant="outline"
                                onClick={() => setShowTester(!showTester)}
                                className="w-full"
                            >
                                {showTester ? 'Hide' : 'Show'} Prompt Tester
                            </Button>
                        )}

                        {showTester && selectedPrompt && !isEditing && (
                            <PromptTester prompt={selectedPrompt} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}