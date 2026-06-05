import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { 
    Search, RefreshCw, Plus, Edit, Trash2, Star, 
    AlertCircle, CheckCircle2, ArrowLeft, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function AdminModelRegistry() {
    const [models, setModels] = useState([]);
    const [filteredModels, setFilteredModels] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadModels();
    }, []);

    useEffect(() => {
        filterModels();
    }, [models, searchQuery, typeFilter]);

    const loadModels = async () => {
        setIsLoading(true);
        setError(''); // Clear previous errors as per outline
        try {
            const { data } = await base44.functions.invoke('adminGetModels');
            if (data.error) {
                throw new Error(data.error);
            }
            // Assuming the function returns an object with a 'models' array property
            setModels(data.models || []); 
        } catch (err) {
            console.error('Error loading models:', err);
            setError(err.message || 'Failed to load models'); // Updated error message as per outline
        } finally {
            setIsLoading(false);
        }
    };

    const filterModels = () => {
        let filtered = [...models];

        if (typeFilter !== 'all') {
            filtered = filtered.filter(m => m.model_type === typeFilter);
        }

        if (searchQuery) {
            filtered = filtered.filter(m => 
                m.model_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.provider.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredModels(filtered);
    };

    const handleToggleActive = async (model) => {
        setError(''); // Clear previous errors
        try {
            // Updated to use base44.functions.invoke
            const { data } = await base44.functions.invoke('adminToggleModelActive', { 
                modelId: model.id, 
                isActive: !model.is_active 
            });
            
            if (data.error) {
                throw new Error(data.error);
            }

            // Using model.model_name for the success message as the backend might not return the full updated object
            setSuccess(`${model.model_name} ${!model.is_active ? 'enabled' : 'disabled'}`);
            await loadModels(); // Reload models to reflect the change
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error toggling model:', err);
            setError(err.message || 'Failed to toggle model'); // Updated error message
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleSetPreferred = async (model, tier) => {
        setError(''); // Clear previous errors
        try {
            const currentDefaults = model.is_default_for_tier || {};
            // Updated to use base44.functions.invoke
            const { data } = await base44.functions.invoke('adminSetModelPreferred', {
                modelId: model.id,
                tier: tier,
                isPreferred: !currentDefaults[tier] // Toggle the preferred status for this specific tier
            });
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            setSuccess(`Updated preferred model for ${tier} tier`);
            await loadModels(); // Reload models to reflect the change
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error setting preferred:', err);
            setError(err.message || 'Failed to set preferred'); // Updated error message
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleDelete = async (modelId, modelName) => {
        if (!window.confirm(`Delete "${modelName}"? This cannot be undone.`)) return;

        setError(''); // Clear previous errors
        try {
            // Updated to use base44.functions.invoke
            const { data } = await base44.functions.invoke('adminDeleteModel', { modelId: modelId });
            if (data.error) {
                throw new Error(data.error);
            }
            setSuccess('Model deleted successfully');
            await loadModels(); // Reload models to reflect the change
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error deleting model:', err);
            setError(err.message || 'Failed to delete model'); // Updated error message
            setTimeout(() => setError(''), 3000);
        }
    };

    // The `handleSaveModel` function outline appears to be for a component
    // responsible for adding/editing a single model (e.g., AdminModelManagement),
    // not for this registry/listing component. It requires state like `editingModel`,
    // `formData`, `setShowForm`, `resetForm` which are not present here.
    // To preserve the existing functionality of AdminModelRegistry as a listing page,
    // and given that the 'Add Model' button links to another page, `handleSaveModel`
    // is intentionally not implemented in this file.

    const getTypeColor = (type) => {
        const colors = {
            llm: 'bg-purple-900 text-purple-300',
            image: 'bg-blue-900 text-blue-300',
            video: 'bg-pink-900 text-pink-300',
            tts: 'bg-green-900 text-green-300'
        };
        return colors[type] || 'bg-gray-900 text-gray-300';
    };

    const getQualityColor = (quality) => {
        const colors = {
            ultra: 'bg-amber-900 text-amber-300',
            premium: 'bg-purple-900 text-purple-300',
            excellent: 'bg-blue-900 text-blue-300',
            good: 'bg-green-900 text-green-300',
            basic: 'bg-slate-700 text-slate-300'
        };
        return colors[quality] || 'bg-gray-900 text-gray-300';
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-center items-center min-h-[400px]">
                        <div className="w-12 h-12 border-4 border-blue-400 border-t-blue-600 rounded-full animate-spin" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <Link 
                            to={createPageUrl('AdminDashboard')}
                            className="inline-flex items-center text-slate-400 hover:text-white mb-4 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Link>
                        <h1 className="text-4xl font-bold text-white mb-2">
                            Model Registry
                        </h1>
                        <p className="text-slate-400">
                            Configure and manage AI models across all providers
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={loadModels}
                            className="bg-slate-900 border-slate-700 text-white hover:bg-slate-800"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                        <Link to={createPageUrl('AdminModelManagement')}>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Model
                            </Button>
                        </Link>
                    </div>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-4"
                        >
                            <Alert className="bg-red-950 border-red-800">
                                <AlertCircle className="h-4 w-4 text-red-400" />
                                <AlertDescription className="text-red-200">{error}</AlertDescription>
                            </Alert>
                        </motion.div>
                    )}
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-4"
                        >
                            <Alert className="bg-green-950 border-green-800">
                                <CheckCircle2 className="h-4 w-4 text-green-400" />
                                <AlertDescription className="text-green-200">{success}</AlertDescription>
                            </Alert>
                        </motion.div>
                    )}
                </AnimatePresence>

                <Card className="bg-slate-900 border-slate-800 mb-6">
                    <CardContent className="pt-6">
                        <div className="flex gap-4 flex-wrap">
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="llm">LLM</SelectItem>
                                    <SelectItem value="image">Image</SelectItem>
                                    <SelectItem value="video">Video</SelectItem>
                                    <SelectItem value="tts">TTS</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search models..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white">
                            Registered Models
                            <Badge variant="outline" className="ml-3 text-slate-400 border-slate-700">
                                {filteredModels.length} models
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-800">
                                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Name</th>
                                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Provider</th>
                                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Type</th>
                                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Quality</th>
                                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Preferred</th>
                                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Enabled</th>
                                        <th className="text-right py-3 px-4 text-slate-400 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredModels.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-12 text-slate-500">
                                                No models found. Try adjusting your filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredModels.map((model) => (
                                            <tr 
                                                key={model.id} 
                                                className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                                            >
                                                <td className="py-4 px-4">
                                                    <div>
                                                        <div className="text-white font-medium">{model.model_name}</div>
                                                        {model.tier_access?.includes('pro') && (
                                                            <Badge className="mt-1 bg-purple-900 text-purple-300 text-xs">
                                                                Pro
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-slate-300">{model.provider}</td>
                                                <td className="py-4 px-4">
                                                    <Badge className={`${getTypeColor(model.model_type)} text-xs`}>
                                                        {model.model_type.toUpperCase()}
                                                    </Badge>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <Badge className={`${getQualityColor(model.quality_rating)} text-xs`}>
                                                        {model.quality_rating}
                                                    </Badge>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex gap-2">
                                                        {['free', 'pro', 'enterprise'].map(tier => (
                                                            <button
                                                                key={tier}
                                                                onClick={() => handleSetPreferred(model, tier)}
                                                                className={`
                                                                    p-1 rounded transition-colors
                                                                    ${model.is_default_for_tier?.[tier]
                                                                        ? 'text-yellow-400 hover:text-yellow-300'
                                                                        : 'text-slate-600 hover:text-slate-400'
                                                                    }
                                                                `}
                                                                title={`Set as preferred for ${tier}`}
                                                            >
                                                                <Star className={`w-4 h-4 ${model.is_default_for_tier?.[tier] ? 'fill-current' : ''}`} />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <button
                                                        onClick={() => handleToggleActive(model)}
                                                        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                                                        style={{
                                                            backgroundColor: model.is_active ? '#3b82f6' : '#475569'
                                                        }}
                                                    >
                                                        <span
                                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                                model.is_active ? 'translate-x-6' : 'translate-x-1'
                                                            }`}
                                                        />
                                                    </button>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex justify-end gap-2">
                                                        <Link to={createPageUrl('AdminModelManagement')}>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-slate-400 hover:text-white hover:bg-slate-800"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(model.id, model.model_name)}
                                                            className="text-red-400 hover:text-red-300 hover:bg-red-950"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-6">
                    <Alert className="bg-blue-950 border-blue-800">
                        <Zap className="h-4 w-4 text-blue-400" />
                        <AlertDescription className="text-blue-200">
                            <strong>Tip:</strong> Set preferred models for each tier to control which models users see by default. Enable/disable models to manage availability.
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        </div>
    );
}