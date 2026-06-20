import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Sparkles, Check, Clock, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

const VIDEO_MODES = [
    {
        id: 'canvas',
        name: 'Quick Mode',
        icon: Zap,
        description: 'Fast slideshow with animated transitions',
        features: [
            'Instant generation',
            'Smooth transitions',
            'Perfect for previews',
            'No additional cost'
        ],
        time: '~30 seconds',
        quality: 'Good',
        cost: 'Free',
        tier: ['free', 'pro', 'enterprise']
    },
    {
        id: 'fal_ai',
        name: 'AI Video',
        icon: Sparkles,
        description: 'Real AI-generated video — choose from 19 models',
        features: [
            'Kling, Runway, Veo 3, Seadance & more',
            '5 cheap / 7 standard / 7 upscale tiers',
            'Audio-enabled: Veo 3, Seadance, Minimax Live',
            'From $0.01 to $0.20 per scene'
        ],
        time: '1–6 minutes',
        quality: 'Good → Ultra',
        cost: '$0.01–$0.20/scene',
        tier: ['pro', 'enterprise']
    }
];

export default function VideoGenerationModeSelector({ selectedMode, onSelect, userTier = 'free' }) {
    const availableModes = VIDEO_MODES.filter(mode => mode.tier.includes(userTier));

    return (
        <Card className="bg-white/60 backdrop-blur-sm border-gray-200">
            <CardHeader>
                <CardTitle className="text-lg">Video Generation Mode</CardTitle>
                <p className="text-sm text-gray-500">Choose how you want to generate your video</p>
            </CardHeader>
            <CardContent className="space-y-3">
                {availableModes.map((mode) => (
                    <motion.div
                        key={mode.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <button
                            onClick={() => onSelect(mode.id)}
                            className={`
                                w-full p-4 rounded-lg border-2 transition-all text-left
                                ${selectedMode === mode.id
                                    ? 'border-amber-400 bg-amber-50'
                                    : 'border-gray-200 bg-white hover:border-amber-300'
                                }
                            `}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 flex-1">
                                    <div className={`
                                        p-2 rounded-lg
                                        ${selectedMode === mode.id
                                            ? 'bg-amber-500 text-white'
                                            : 'bg-gray-100 text-gray-600'
                                        }
                                    `}>
                                        <mode.icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                            {mode.name}
                                            {selectedMode === mode.id && (
                                                <Check className="w-4 h-4 text-amber-500" />
                                            )}
                                        </h3>
                                        <p className="text-sm text-gray-600 mt-1">{mode.description}</p>
                                        
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {mode.time}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                {mode.quality} Quality
                                            </Badge>
                                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                                                <DollarSign className="w-3 h-3" />
                                                {mode.cost}
                                            </Badge>
                                        </div>

                                        <ul className="mt-3 space-y-1">
                                            {mode.features.map((feature, idx) => (
                                                <li key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                                                    <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </button>
                    </motion.div>
                ))}

                {userTier === 'free' && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                            <strong>Upgrade to Pro</strong> to unlock AI video generation with Runway, Minimax, and professional templates.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}