import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
        }

        // Image Models
        const imageModels = [
            // Best Tier
            {
                model_name: 'Gemini 3.0 Preview Image',
                provider: 'google',
                model_type: 'image',
                tier_access: ['pro', 'enterprise'],
                is_active: true,
                cost_per_unit: 0.04,
                quality_rating: 'ultra',
                description: 'Google Gemini 3.0 - Advanced photorealistic image generation',
                estimated_time: '6-10 seconds',
                is_default_for_tier: { pro: true, enterprise: false }
            },
            {
                model_name: 'Gemini 2.5 Flash Image',
                provider: 'google',
                model_type: 'image',
                tier_access: ['free', 'pro', 'enterprise'],
                is_active: true,
                cost_per_unit: 0.02,
                quality_rating: 'premium',
                description: 'Google Gemini 2.5 Flash - Fast, high-quality image generation',
                estimated_time: '3-6 seconds',
                is_default_for_tier: { free: true, pro: false, enterprise: true }
            },
            {
                model_name: 'Nano Banana Pro',
                provider: 'fal_ai',
                model_type: 'image',
                tier_access: ['pro', 'enterprise'],
                is_active: true,
                cost_per_unit: 0.04,
                quality_rating: 'ultra',
                description: 'Reference Consistency - Best for character consistency',
                estimated_time: '10-15 seconds',
                is_default_for_tier: { pro: false, enterprise: false }
            },
            {
                model_name: 'Flux 1.1 Pro',
                provider: 'fal_ai',
                model_type: 'image',
                tier_access: ['pro', 'enterprise'],
                is_active: true,
                cost_per_unit: 0.05,
                quality_rating: 'ultra',
                description: 'Photorealism - Hyper-realistic image generation',
                estimated_time: '10-15 seconds',
                is_default_for_tier: { pro: false, enterprise: false }
            },
            {
                model_name: 'Recraft v3',
                provider: 'fal_ai',
                model_type: 'image',
                tier_access: ['pro', 'enterprise'],
                is_active: true,
                cost_per_unit: 0.04,
                quality_rating: 'ultra',
                description: 'Vector/Brand - Perfect for logos and brand assets',
                estimated_time: '8-12 seconds',
                is_default_for_tier: { pro: false, enterprise: false }
            },
            // Mid Tier
            {
                model_name: 'Flux Dev',
                provider: 'fal_ai',
                model_type: 'image',
                tier_access: ['free', 'pro', 'enterprise'],
                is_active: true,
                cost_per_unit: 0.025,
                quality_rating: 'excellent',
                description: 'Open Weights - Great balance of quality and speed',
                estimated_time: '8-10 seconds',
                is_default_for_tier: { free: false }
            },
            {
                model_name: 'Midjourney',
                provider: 'piapi',
                model_type: 'image',
                tier_access: ['pro', 'enterprise'],
                is_active: true,
                cost_per_unit: 0.06,
                quality_rating: 'excellent',
                description: 'Aesthetics - Beautiful artistic generations',
                estimated_time: '15-20 seconds',
                is_default_for_tier: { pro: false, enterprise: false }
            },
            {
                model_name: 'SD 3.5 Large',
                provider: 'fal_ai',
                model_type: 'image',
                tier_access: ['free', 'pro', 'enterprise'],
                is_active: true,
                cost_per_unit: 0.03,
                quality_rating: 'excellent',
                description: 'Anatomy - Excellent for human figures',
                estimated_time: '10-12 seconds',
                is_default_for_tier: { free: false }
            },
            // Cheap Tier
            {
                model_name: 'Flux Schnell',
                provider: 'fal_ai',
                model_type: 'image',
                tier_access: ['free', 'pro', 'enterprise'],
                is_active: true,
                cost_per_unit: 0.003,
                quality_rating: 'good',
                description: 'Speed/Cost - Ultra-fast generations',
                estimated_time: '3-5 seconds',
                is_default_for_tier: { free: false }
            },
            {
                model_name: 'SDXL Lightning',
                provider: 'fal_ai',
                model_type: 'image',
                tier_access: ['free', 'pro', 'enterprise'],
                is_active: true,
                cost_per_unit: 0.001,
                quality_rating: 'good',
                description: 'Sub-second - Fastest generation available',
                estimated_time: '1-2 seconds',
                is_default_for_tier: { free: false }
            },
            {
                model_name: 'Playground v2.5',
                provider: 'fal_ai',
                model_type: 'image',
                tier_access: ['free', 'pro', 'enterprise'],
                is_active: true,
                cost_per_unit: 0.002,
                quality_rating: 'good',
                description: 'Lighting - Great lighting effects',
                estimated_time: '5-8 seconds',
                is_default_for_tier: { free: false }
            }
        ];

        // Video Models
        const videoModels = [
            // Best Tier
            {
                model_name: 'Veo 3.1',
                provider: 'piapi',
                model_type: 'video',
                tier_access: ['enterprise'],
                is_active: true,
                cost_per_unit: 2.00,
                quality_rating: 'ultra',
                description: 'Physics/Ref Image - Top quality physics simulation',
                estimated_time: '2-3 minutes',
                is_default_for_tier: { enterprise: true },
                api_parameters: { duration: 8 }
            },
            {
                model_name: 'Kling 2.6 Pro',
                provider: 'fal_ai',
                model_type: 'video',
                tier_access: ['pro', 'enterprise'],
                is_active: true,
                cost_per_unit: 0.35,
                quality_rating: 'ultra',
                description: 'Native Lip Sync - Perfect for talking videos',
                estimated_time: '1-2 minutes',
                is_default_for_tier: { pro: true },
                api_parameters: { duration: 5 }
            },
            {
                model_name: 'Runway Aleph',
                provider: 'piapi',
                model_type: 'video',
                tier_access: ['pro', 'enterprise'],
                is_active: true,
                cost_per_unit: 0.50,
                quality_rating: 'ultra',
                description: 'Vid-to-Vid - Professional video transformation',
                estimated_time: '2-4 minutes',
                is_default_for_tier: { pro: false, enterprise: false }
            },
            // Mid Tier
            {
                model_name: 'Wan 2.6',
                provider: 'fal_ai',
                model_type: 'video',
                tier_access: ['free', 'pro', 'enterprise'],
                is_active: true,
                cost_per_unit: 0.15,
                quality_rating: 'excellent',
                description: '1080p - High quality video generation',
                estimated_time: '1-2 minutes',
                is_default_for_tier: { free: true }
            },
            {
                model_name: 'MiniMax Video',
                provider: 'fal_ai',
                model_type: 'video',
                tier_access: ['free', 'pro', 'enterprise'],
                is_active: true,
                cost_per_unit: 0.50,
                quality_rating: 'excellent',
                description: 'Prompt Opt. - Smart prompt optimization',
                estimated_time: '1-2 minutes',
                is_default_for_tier: { free: false }
            },
            {
                model_name: 'Luma Dream',
                provider: 'fal_ai',
                model_type: 'video',
                tier_access: ['free', 'pro', 'enterprise'],
                is_active: true,
                cost_per_unit: 0.50,
                quality_rating: 'excellent',
                description: 'Loops - Perfect for seamless loops',
                estimated_time: '1-2 minutes',
                is_default_for_tier: { free: false }
            },
            // Special
            {
                model_name: 'LivePortrait',
                provider: 'fal_ai',
                model_type: 'video',
                tier_access: ['pro', 'enterprise'],
                is_active: true,
                cost_per_unit: 0.01,
                quality_rating: 'premium',
                description: 'Avatar Control - Precise facial animation',
                estimated_time: '30-60 seconds',
                is_default_for_tier: { pro: false, enterprise: false }
            },
            {
                model_name: 'SyncLabs',
                provider: 'fal_ai',
                model_type: 'video',
                tier_access: ['pro', 'enterprise'],
                is_active: true,
                cost_per_unit: 0.70,
                quality_rating: 'premium',
                description: 'Lip Sync Utility - Professional lip sync',
                estimated_time: '1-2 minutes',
                is_default_for_tier: { pro: false, enterprise: false },
                api_parameters: { per_minute: true }
            },
            // Cheap
            {
                model_name: 'SVD XT',
                provider: 'fal_ai',
                model_type: 'video',
                tier_access: ['free', 'pro', 'enterprise'],
                is_active: true,
                cost_per_unit: 0.001,
                quality_rating: 'good',
                description: 'Backgrounds - Simple motion backgrounds',
                estimated_time: '20-30 seconds',
                is_default_for_tier: { free: false }
            }
        ];

        // LLM Models
        const llmModels = [
            // OpenAI Models
            {
                model_name: 'gpt-4o',
                provider: 'openai',
                model_type: 'llm',
                tier_access: ['free', 'pro', 'enterprise'],
                is_active: true,
                cost_per_unit: 0.005,
                quality_rating: 'excellent',
                description: 'Most capable GPT-4 model, balanced performance',
                estimated_time: '5-10 seconds',
                is_default_for_tier: { free: true, pro: true, enterprise: true }
            },
            {
                model_name: 'gpt-4o-mini',
                provider: 'openai',
                model_type: 'llm',
                tier_access: ['free', 'pro', 'enterprise'],
                is_active: true,
                cost_per_unit: 0.0015,
                quality_rating: 'good',
                description: 'Fast and affordable, great for most tasks',
                estimated_time: '3-5 seconds',
                is_default_for_tier: { free: false }
            },
            // Google Gemini Models - Updated to current versions
            {
                model_name: 'gemini-2.0-flash-exp',
                provider: 'google',
                model_type: 'llm',
                tier_access: ['free', 'pro', 'enterprise'],
                is_active: true,
                cost_per_unit: 0.002,
                quality_rating: 'excellent',
                description: 'Latest Gemini 2.0 Flash - Fast and capable',
                estimated_time: '3-5 seconds',
                is_default_for_tier: { free: false }
            },
            {
                model_name: 'gemini-1.5-pro',
                provider: 'google',
                model_type: 'llm',
                tier_access: ['pro', 'enterprise'],
                is_active: true,
                cost_per_unit: 0.007,
                quality_rating: 'excellent',
                description: 'Gemini Pro - High quality reasoning',
                estimated_time: '5-8 seconds',
                is_default_for_tier: { pro: false, enterprise: false }
            },
            {
                model_name: 'gemini-1.5-flash',
                provider: 'google',
                model_type: 'llm',
                tier_access: ['free', 'pro', 'enterprise'],
                is_active: true,
                cost_per_unit: 0.001,
                quality_rating: 'good',
                description: 'Gemini Flash - Fast and efficient',
                estimated_time: '2-4 seconds',
                is_default_for_tier: { free: false }
            },
            // Anthropic Claude Models
            {
                model_name: 'claude-3-5-sonnet-20241022',
                provider: 'anthropic',
                model_type: 'llm',
                tier_access: ['pro', 'enterprise'],
                is_active: true,
                cost_per_unit: 0.015,
                quality_rating: 'ultra',
                description: 'Latest Claude Sonnet - Best reasoning',
                estimated_time: '8-12 seconds',
                is_default_for_tier: { pro: false, enterprise: false }
            },
            {
                model_name: 'claude-3-5-haiku-20241022',
                provider: 'anthropic',
                model_type: 'llm',
                tier_access: ['free', 'pro', 'enterprise'],
                is_active: true,
                cost_per_unit: 0.004,
                quality_rating: 'excellent',
                description: 'Claude Haiku - Fast and smart',
                estimated_time: '3-5 seconds',
                is_default_for_tier: { free: false }
            }
        ];

        // Voice/TTS Models (keeping existing ones, can be expanded)
        const voiceModels = [
            {
                model_name: 'Google Neural2',
                provider: 'google',
                model_type: 'tts',
                tier_access: ['free', 'pro', 'enterprise'],
                is_active: true,
                cost_per_unit: 0.016,
                quality_rating: 'excellent',
                description: 'Natural-sounding Neural2 voices, multiple languages',
                estimated_time: '2-5 seconds',
                is_default_for_tier: { free: true, pro: false, enterprise: false },
                api_parameters: { voice_name: 'en-US-Neural2-C', language_code: 'en-US' }
            },
            {
                model_name: 'Google WaveNet',
                provider: 'google',
                model_type: 'tts',
                tier_access: ['pro', 'enterprise'],
                is_active: true,
                cost_per_unit: 0.016,
                quality_rating: 'ultra',
                description: 'High-fidelity WaveNet voices, most natural',
                estimated_time: '3-6 seconds',
                is_default_for_tier: { pro: true, enterprise: true },
                api_parameters: { voice_name: 'en-US-Wavenet-D', language_code: 'en-US' }
            },
            {
                model_name: 'Google Studio',
                provider: 'google',
                model_type: 'tts',
                tier_access: ['pro', 'enterprise'],
                is_active: true,
                cost_per_unit: 0.016,
                quality_rating: 'premium',
                description: 'Studio quality voices for professional content',
                estimated_time: '3-6 seconds',
                is_default_for_tier: { pro: false, enterprise: false },
                api_parameters: { voice_name: 'en-US-Studio-M', language_code: 'en-US' }
            },
            {
                model_name: 'Browser TTS',
                provider: 'browser',
                model_type: 'tts',
                tier_access: ['free', 'pro', 'enterprise'],
                is_active: true,
                cost_per_unit: 0,
                quality_rating: 'basic',
                description: 'Browser-based text-to-speech (backup)',
                estimated_time: 'Instant',
                is_default_for_tier: { free: false }
            },
            {
                model_name: 'ElevenLabs Multilingual v2',
                provider: 'elevenlabs',
                model_type: 'tts',
                tier_access: ['pro', 'enterprise'],
                is_active: true,
                cost_per_unit: 0.30,
                quality_rating: 'ultra',
                description: 'Professional AI voices with emotion',
                estimated_time: '5-10 seconds',
                is_default_for_tier: { pro: false, enterprise: false },
                api_parameters: { voice_id: 'default', model_id: 'eleven_multilingual_v2' }
            }
        ];

        const allModels = [...llmModels, ...imageModels, ...videoModels, ...voiceModels];
        
        // Delete existing models to avoid duplicates
        const existing = await base44.asServiceRole.entities.AIModelConfig.list();
        for (const model of existing) {
            await base44.asServiceRole.entities.AIModelConfig.delete(model.id);
        }

        // Create new models
        const created = [];
        for (const model of allModels) {
            const result = await base44.asServiceRole.entities.AIModelConfig.create(model);
            created.push(result);
        }

        return Response.json({ 
            success: true, 
            message: `Successfully seeded ${created.length} models`,
            models: created
        });

    } catch (error) {
        console.error('Seed models error:', error);
        return Response.json({ 
            error: error.message || 'Failed to seed models' 
        }, { status: 500 });
    }
});