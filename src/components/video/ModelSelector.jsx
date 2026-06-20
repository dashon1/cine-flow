import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Zap, Brain, Sparkles, Crown, Volume2, VideoOff } from "lucide-react";

export default function ModelSelector({ 
    models, 
    selectedModelId, 
    onSelect, 
    label = "AI Model",
    disabled = false 
}) {
    const getQualityIcon = (rating) => {
        switch (rating) {
            case 'ultra':
                return <Crown className="w-3 h-3 text-purple-500" />;
            case 'premium':
                return <Sparkles className="w-3 h-3 text-amber-500" />;
            case 'excellent':
                return <Brain className="w-3 h-3 text-blue-500" />;
            default:
                return <Zap className="w-3 h-3 text-green-500" />;
        }
    };

    const getQualityColor = (rating) => {
        switch (rating) {
            case 'ultra':
                return 'border-purple-500 text-purple-600';
            case 'premium':
                return 'border-amber-500 text-amber-600';
            case 'excellent':
                return 'border-blue-500 text-blue-600';
            default:
                return 'border-green-500 text-green-600';
        }
    };

    const groupedModels = models.reduce((acc, model) => {
        const key = (model.model_type === 'video' && model.video_tier)
            ? `video_${model.video_tier}`
            : model.provider;
        if (!acc[key]) acc[key] = [];
        acc[key].push(model);
        return acc;
    }, {});

    const TIER_ORDER = ['video_cheap', 'video_standard', 'video_upscale'];
    const sortedGroupKeys = Object.keys(groupedModels).sort((a, b) => {
        const ai = TIER_ORDER.indexOf(a);
        const bi = TIER_ORDER.indexOf(b);
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return 0;
    });

    const getGroupLabel = (key) => {
        if (key === 'video_cheap') return '⚡ Cheap — Fast & Affordable';
        if (key === 'video_standard') return '✨ Standard — Best Balance';
        if (key === 'video_upscale') return '👑 Upscale — Max Quality';
        return key.replace(/_/g, ' ');
    };

    const selectedModel = models.find(m => m.id === selectedModelId);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">
                    {label}
                </label>
                {selectedModel && (
                    <Badge 
                        variant="outline" 
                        className={`text-xs ${getQualityColor(selectedModel.quality_rating)}`}
                    >
                        {selectedModel.quality_rating}
                    </Badge>
                )}
            </div>
            
            <Select 
                value={selectedModelId} 
                onValueChange={onSelect}
                disabled={disabled}
            >
                <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select model..." />
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
                    {sortedGroupKeys.map((provider) => (
                        <div key={provider}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase">
                                {getGroupLabel(provider)}
                            </div>
                            {groupedModels[provider].map((model) => (
                                <SelectItem key={model.id} value={model.id}>
                                    <div className="flex flex-col gap-1 w-full">
                                        <div className="flex items-center justify-between gap-3 w-full">
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                {getQualityIcon(model.quality_rating)}
                                                <span className="font-medium truncate">{model.name || model.model_name}</span>
                                                {model.model_variant && (
                                                    <span className="text-xs text-slate-500">({model.model_variant})</span>
                                                )}
                                            </div>
                                            {model.estimated_time && (
                                                <span className="text-xs text-slate-400 whitespace-nowrap">
                                                    ⏱️ {model.estimated_time}
                                                </span>
                                            )}
                                        </div>
                                        {model.model_type === 'video' && (
                                            <div className="flex items-center gap-1">
                                                {model.has_audio ? (
                                                    <div className="flex items-center gap-1 text-xs text-green-600">
                                                        <Volume2 className="w-3 h-3" />
                                                        <span>Audio + Video</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-xs text-amber-600">
                                                        <VideoOff className="w-3 h-3" />
                                                        <span>Video Only</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </SelectItem>
                            ))}
                        </div>
                    ))}
                </SelectContent>
            </Select>
            
            {selectedModel && selectedModel.description && (
                <p className="text-xs text-slate-500 leading-relaxed">
                    {selectedModel.description}
                </p>
            )}
            
            <p className="text-xs text-slate-500">
                Higher quality models produce better results but may take longer
            </p>
        </div>
    );
}