import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Sparkles, Crown, Check } from 'lucide-react';

const tierIcons = {
  economy: <Zap className="w-4 h-4" />,
  midsection: <Sparkles className="w-4 h-4" />,
  top_section: <Crown className="w-4 h-4" />
};

const tierLabels = {
  economy: 'Economy',
  midsection: 'Mid-Tier',
  top_section: 'Premium'
};

const tierColors = {
  economy: 'bg-blue-100 text-blue-800 border-blue-300',
  midsection: 'bg-purple-100 text-purple-800 border-purple-300',
  top_section: 'bg-amber-100 text-amber-800 border-amber-300'
};

export default function ModelTierSelector({ modelType, category, onSelect, userTier = 'free' }) {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadModels();
  }, [modelType, category, userTier]);

  const loadModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await base44.functions.invoke('selectOptimalModel', {
        model_type: modelType,
        category: category || undefined,
        user_tier: userTier
      });

      setModels(response.all_available || []);
      if (response.recommended) {
        setSelectedModel(response.recommended);
      }
    } catch (err) {
      setError(err.message || 'Failed to load models');
      console.error('Model loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectModel = (model) => {
    setSelectedModel(model);
    onSelect?.(model);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-700 text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (models.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-600 text-sm">No models available for your tier.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Select AI Model</h3>
        <div className="grid gap-3">
          {models.map((model) => (
            <div
              key={model.id}
              onClick={() => handleSelectModel(model)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedModel?.id === model.id
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">{model.model_name}</h4>
                    <Badge
                      variant="outline"
                      className={`${tierColors[model.tier_level]} border`}
                    >
                      <span className="mr-1">{tierIcons[model.tier_level]}</span>
                      {tierLabels[model.tier_level]}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {model.provider}
                    </Badge>
                  </div>
                  
                  {model.description && (
                    <p className="text-sm text-gray-600 mb-3">{model.description}</p>
                  )}
                  
                  <div className="flex gap-3 text-xs">
                    {model.quality_rating && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Quality:</span>
                        <span className="font-medium text-gray-700 capitalize">
                          {model.quality_rating}
                        </span>
                      </div>
                    )}
                    {model.estimated_time && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Time:</span>
                        <span className="font-medium text-gray-700">
                          {model.estimated_time}
                        </span>
                      </div>
                    )}
                    {model.cost_per_unit && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Cost:</span>
                        <span className="font-medium text-gray-700">
                          ${model.cost_per_unit}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedModel?.id === model.id && (
                  <div className="ml-3 p-1 bg-amber-400 text-white rounded-full">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedModel && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            <span className="font-semibold">Selected:</span> {selectedModel.model_name}
            {selectedModel.model_variant && ` (${selectedModel.model_variant})`}
          </p>
        </div>
      )}
    </div>
  );
}