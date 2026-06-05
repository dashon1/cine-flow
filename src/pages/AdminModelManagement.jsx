
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";
import { 
    Settings, Plus, Edit2, Trash2, Save, X, Copy, 
    AlertCircle, CheckCircle2, Cpu, Image as ImageIcon, 
    Mic, Video, Sparkles, Eye, EyeOff, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MODEL_PROVIDERS = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'anthropic', label: 'Anthropic (Claude)' },
    { value: 'google', label: 'Google (Gemini)' },
    { value: 'fal_ai', label: 'FAL.AI' },
    { value: 'elevenlabs', label: 'ElevenLabs' },
    { value: 'runway', label: 'Runway ML' },
    { value: 'midjourney', label: 'Midjourney' },
    { value: 'stability', label: 'Stability AI' },
    { value: 'pika', label: 'Pika Labs' },
    { value: 'luma', label: 'Luma AI' },
    { value: 'kling', label: 'Kling AI' },
    { value: 'json2video', label: 'Json2Video' },
    { value: 'creatomate', label: 'Creatomate' },
    { value: 'local', label: 'Local/Browser' }
];

const MODEL_TYPES = [
    { value: 'llm', label: 'LLM (Text Generation)', icon: Cpu },
    { value: 'image', label: 'Image Generation', icon: ImageIcon },
    { value: 'tts', label: 'Text-to-Speech', icon: Mic },
    { value: 'video', label: 'Video Generation', icon: Video }
];

const QUALITY_RATINGS = [
    { value: 'basic', label: 'Basic' },
    { value: 'good', label: 'Good' },
    { value: 'excellent', label: 'Excellent' },
    { value: 'premium', label: 'Premium' },
    { value: 'ultra', label: 'Ultra' }
];

// October 2025 - Current Best Models & Presets
const MODEL_TEMPLATES_2025 = {
    llm: [
        {
            model_name: 'GPT-5',
            provider: 'openai',
            description: 'OpenAI\'s most advanced model with native multimodal capabilities and enhanced reasoning',
            quality_rating: 'ultra',
            estimated_time: '2-4 seconds',
            cost_per_unit: 0.008,
            api_parameters: { model: 'gpt-5', temperature: 0.7, max_tokens: 8000 }
        },
        {
            model_name: 'GPT-4o',
            provider: 'openai',
            description: 'Fast and capable model optimized for real-time applications',
            quality_rating: 'premium',
            estimated_time: '1-3 seconds',
            cost_per_unit: 0.005,
            api_parameters: { model: 'gpt-4o', temperature: 0.7, max_tokens: 4000 }
        },
        {
            model_name: 'Claude 4.5 Sonnet',
            provider: 'anthropic',
            description: 'Anthropic\'s balanced model with excellent accuracy and safety features',
            quality_rating: 'ultra',
            estimated_time: '2-4 seconds',
            cost_per_unit: 0.006,
            api_parameters: { model: 'claude-4-5-sonnet-20251015', max_tokens: 8192, temperature: 0.7 }
        },
        {
            model_name: 'Claude 4 Opus',
            provider: 'anthropic',
            description: 'Most capable Claude model for complex enterprise tasks',
            quality_rating: 'ultra',
            estimated_time: '3-6 seconds',
            cost_per_unit: 0.015,
            api_parameters: { model: 'claude-4-opus-20250815', max_tokens: 8192, temperature: 0.7 }
        },
        {
            model_name: 'Claude 4 Haiku',
            provider: 'anthropic',
            description: 'Fast and cost-effective Claude model for simple tasks',
            quality_rating: 'good',
            estimated_time: '1-2 seconds',
            cost_per_unit: 0.001,
            api_parameters: { model: 'claude-4-haiku-20250815', max_tokens: 4096, temperature: 0.7 }
        },
        {
            model_name: 'Gemini 2.5 Pro',
            provider: 'google',
            description: 'Google\'s flagship model with massive context window and multimodal excellence',
            quality_rating: 'ultra',
            estimated_time: '2-5 seconds',
            cost_per_unit: 0.004,
            api_parameters: { model: 'gemini-2.5-pro', temperature: 0.7, max_output_tokens: 8192 }
        },
        {
            model_name: 'Gemini 2.0 Flash',
            provider: 'google',
            description: 'Ultra-fast Gemini variant for quick responses',
            quality_rating: 'excellent',
            estimated_time: '1-2 seconds',
            cost_per_unit: 0.0005,
            api_parameters: { model: 'gemini-2.0-flash', temperature: 0.7, max_output_tokens: 8192 }
        }
    ],
    image: [
        {
            model_name: 'DALL-E 4',
            provider: 'openai',
            description: 'OpenAI\'s latest image generation with unparalleled photorealism',
            quality_rating: 'ultra',
            estimated_time: '8-12 seconds',
            cost_per_unit: 0.12,
            api_parameters: { model: 'dall-e-4', size: '1792x1024', quality: 'ultra' }
        },
        {
            model_name: 'Midjourney v7',
            provider: 'midjourney',
            description: 'Industry-leading artistic image generation with incredible detail',
            quality_rating: 'ultra',
            estimated_time: '15-25 seconds',
            cost_per_unit: 0.10,
            api_parameters: { version: '7', quality: '2', stylize: '1000' }
        },
        {
            model_name: 'Flux 1.1 Pro Ultra',
            provider: 'fal_ai',
            description: 'State-of-the-art open model with professional quality',
            quality_rating: 'ultra',
            estimated_time: '10-15 seconds',
            cost_per_unit: 0.06,
            api_parameters: { model: 'fal-ai/flux-pro/v1.1-ultra', image_size: 'landscape_16_9', num_inference_steps: 40, guidance_scale: 7.5 }
        },
        {
            model_name: 'Flux 1.1 Pro',
            provider: 'fal_ai',
            description: 'Fast and high-quality open image generation',
            quality_rating: 'premium',
            estimated_time: '6-10 seconds',
            cost_per_unit: 0.04,
            api_parameters: { model: 'fal-ai/flux-pro/v1.1', image_size: 'landscape_16_9', num_inference_steps: 28 }
        },
        {
            model_name: 'Stable Diffusion 3.5 Large',
            provider: 'stability',
            description: 'Latest Stability AI model with excellent prompt adherence',
            quality_rating: 'excellent',
            estimated_time: '8-12 seconds',
            cost_per_unit: 0.05,
            api_parameters: { model: 'sd3.5-large', cfg_scale: 7, steps: 40 }
        },
        {
            model_name: 'Imagen 3',
            provider: 'google',
            description: 'Google\'s photorealistic image generation model',
            quality_rating: 'premium',
            estimated_time: '10-15 seconds',
            cost_per_unit: 0.08,
            api_parameters: { model: 'imagen-3', aspect_ratio: '16:9' }
        }
    ],
    video: [
        {
            model_name: 'Runway Gen-4 Turbo',
            provider: 'runway',
            description: 'Latest Runway model with exceptional motion quality and speed',
            quality_rating: 'ultra',
            estimated_time: '60-90 seconds',
            cost_per_unit: 0.15,
            api_parameters: { model: 'gen-4-turbo', duration: 5, motion_score: 8 }
        },
        {
            model_name: 'Runway Gen-3 Alpha',
            provider: 'fal_ai',
            description: 'High-quality video generation via FAL.AI platform',
            quality_rating: 'premium',
            estimated_time: '90-150 seconds',
            cost_per_unit: 0.10,
            api_parameters: { model: 'fal-ai/runway-gen3/turbo/image-to-video', duration: 5 }
        },
        {
            model_name: 'Luma Dream Machine 2.0',
            provider: 'luma',
            description: 'Luma\'s second generation dream machine with realistic physics',
            quality_rating: 'ultra',
            estimated_time: '45-75 seconds',
            cost_per_unit: 0.12,
            api_parameters: { version: '2.0', duration: 5, quality: 'high' }
        },
        {
            model_name: 'Pika 2.0',
            provider: 'pika',
            description: 'Fast video generation with creative effects and transitions',
            quality_rating: 'premium',
            estimated_time: '30-60 seconds',
            cost_per_unit: 0.08,
            api_parameters: { model: 'pika-2.0', duration: 5, fps: 24 }
        },
        {
            model_name: 'Kling AI 1.5',
            provider: 'kling',
            description: 'Chinese video model with excellent motion and detail',
            quality_rating: 'excellent',
            estimated_time: '60-120 seconds',
            cost_per_unit: 0.07,
            api_parameters: { model: 'kling-v1.5', duration: 5, mode: 'professional' }
        },
        {
            model_name: 'Minimax Video-01',
            provider: 'fal_ai',
            description: 'Cost-effective video generation with good quality',
            quality_rating: 'good',
            estimated_time: '30-45 seconds',
            cost_per_unit: 0.03,
            api_parameters: { model: 'fal-ai/minimax/video-01', duration: 5 }
        },
        {
            model_name: 'Google Veo 2',
            provider: 'google',
            description: 'Google\'s advanced video model with cinematic quality',
            quality_rating: 'ultra',
            estimated_time: '120-180 seconds',
            cost_per_unit: 0.20,
            api_parameters: { model: 'veo-2', duration: 5, quality: 'cinematic' }
        }
    ],
    tts: [
        {
            model_name: 'ElevenLabs Turbo v3',
            provider: 'elevenlabs',
            description: 'Lightning-fast voice generation with natural emotion',
            quality_rating: 'ultra',
            estimated_time: '1-2 seconds',
            cost_per_unit: 0.0003,
            api_parameters: { model_id: 'eleven_turbo_v2_5', voice_settings: { stability: 0.5, similarity_boost: 0.75 } }
        },
        {
            model_name: 'OpenAI TTS-2',
            provider: 'openai',
            description: 'Natural-sounding voices with multiple options',
            quality_rating: 'premium',
            estimated_time: '2-3 seconds',
            cost_per_unit: 0.0002,
            api_parameters: { model: 'tts-2', voice: 'alloy', speed: 1.0 }
        },
        {
            model_name: 'Google Cloud TTS Neural2',
            provider: 'google',
            description: 'High-quality neural voices in 50+ languages',
            quality_rating: 'excellent',
            estimated_time: '2-4 seconds',
            cost_per_unit: 0.00016,
            api_parameters: { voice_type: 'Neural2', speaking_rate: 1.0, pitch: 0 }
        },
        {
            model_name: 'Browser TTS',
            provider: 'local',
            description: 'Free browser-based text-to-speech (quality varies)',
            quality_rating: 'basic',
            estimated_time: 'Instant',
            cost_per_unit: 0,
            api_parameters: { provider: 'browser', rate: 1.0, pitch: 1.0 }
        }
    ]
};

const STYLE_PRESETS = {
    image: [
        {
            name: 'Cartoon/Animation',
            keywords: 'cartoon style, animated, hand-drawn, cel animation, 2D animation, bold outlines, clean lines, vibrant colors, flat colors, Disney style, Pixar quality',
            description: 'Classic animated aesthetic with bold colors and clear lines'
        },
        {
            name: 'Pixar 3D/CGI',
            keywords: 'Pixar style, CGI animation, 3D rendered, photorealistic animation, volumetric lighting, soft shadows, expressive characters, detailed textures, stylized realism, Dreamworks quality',
            description: 'Professional 3D animation quality like Pixar/Dreamworks films'
        },
        {
            name: 'Anime/Manga',
            keywords: 'anime art style, Japanese animation, cel-shaded, expressive eyes, dynamic poses, vibrant colors, manga aesthetic, Studio Ghibli style, shonen anime style',
            description: 'Japanese anime/manga style with expressive features'
        },
        {
            name: 'Horror/Gothic',
            keywords: 'dark atmosphere, gothic horror, cosmic horror, low light, deep shadows, unsettling mood, decaying textures, ominous lighting, psychological thriller aesthetic',
            description: 'Dark, atmospheric horror aesthetic with dread and tension'
        },
        {
            name: 'Photorealistic',
            keywords: 'photorealistic, 8k resolution, ultra detailed, professional photography, natural lighting, realistic textures, DSLR quality, cinematic photography',
            description: 'Photo-quality realistic images indistinguishable from photographs'
        },
        {
            name: 'Minimalist/Line Art',
            keywords: 'stick figure art, minimalist drawing, simple lines, line art, doodle style, white background, black lines, clean design, modern minimalism',
            description: 'Simple, minimalist line art style'
        },
        {
            name: 'Cinematic Film',
            keywords: 'cinematic lighting, film grain, anamorphic lens, Hollywood quality, dramatic shadows, epic composition, color grading, movie still, theatrical lighting',
            description: 'Professional film/movie quality with cinematic composition'
        },
        {
            name: 'Cyberpunk/Sci-Fi',
            keywords: 'cyberpunk aesthetic, neon lights, futuristic, sci-fi technology, holographic displays, dystopian, blade runner style, high-tech low-life',
            description: 'Futuristic cyberpunk with neon and technology'
        }
    ],
    video: [
        {
            name: 'Dynamic Action',
            keywords: 'dynamic camera movement, fast-paced action, sweeping shots, rapid zooms, tracking shots, high energy motion',
            directives: {
                camera: 'Dynamic camera moves, sweeping pans, rapid zooms for impact, tracking shots following action',
                editing: 'Fast-paced cuts, smooth transitions between action beats',
                motion: 'Subject in constant motion, camera actively following and anticipating movement'
            },
            description: 'High-energy action with dynamic camera work'
        },
        {
            name: 'Anime Battle',
            keywords: 'anime style action, dynamic poses, speed lines, impact frames, dramatic camera angles, exaggerated movements',
            directives: {
                camera: 'Dynamic camera moves, character POV shots, dramatic low and high angles, rotating camera',
                editing: 'Fast cuts for action sequences, slow-motion for dramatic impact moments, speed line transitions',
                visualFx: 'Speed lines, impact frames with freeze, aura effects, power-up glows'
            },
            description: 'Anime-style action with speed lines and dramatic angles'
        },
        {
            name: 'Horror/Suspense',
            keywords: 'slow creeping movement, ominous atmosphere, shadows lengthening, flickering lights, unsettling mood, dread building',
            directives: {
                camera: 'Slow creeping dolly shots, static wide shots building tension, sudden jarring close-ups for scares',
                editing: 'Slow deliberate pacing, long takes to build dread, sudden jump cuts for shock',
                visualFx: 'Film grain, moving shadows, flickering lights, desaturated colors, vignette'
            },
            description: 'Slow-building horror with creeping dread'
        },
        {
            name: 'Comedy/Energetic',
            keywords: 'exaggerated movements, bright vibrant colors, energetic bouncy motion, playful camera work, fun and lighthearted',
            directives: {
                camera: 'Quick whip pans, exaggerated zooms, wide shots for physical comedy, bouncy camera movements',
                editing: 'Rapid-fire cuts, sped-up footage for comic effect, slow-motion for comedic impact',
                visualFx: 'Cartoon sound effect overlays, text pop-ups, bright color pops'
            },
            description: 'Fun, energetic style with playful camera work'
        },
        {
            name: 'Cinematic Drama',
            keywords: 'slow deliberate camera movement, emotional depth, dramatic lighting, film quality, contemplative pacing',
            directives: {
                camera: 'Smooth tracking shots, slow pans revealing emotion, static shots for intimate moments, shallow depth of field',
                editing: 'Slow pacing allowing scenes to breathe, long takes, meaningful cuts at emotional beats',
                visualFx: 'Film grain, color grading, subtle lens flares, cinematic aspect ratio'
            },
            description: 'Slow, emotional cinematic style'
        },
        {
            name: 'Documentary/Natural',
            keywords: 'realistic movement, natural camera work, observational style, authentic feel, handheld aesthetic',
            directives: {
                camera: 'Handheld feel with natural shake, observational static shots, gentle pans following subjects',
                editing: 'Real-time pacing, authentic cuts, no artificial effects',
                visualFx: 'Minimal effects, natural color grading, realistic look'
            },
            description: 'Documentary-style realism with natural camera work'
        },
        {
            name: 'Music Video/Stylized',
            keywords: 'stylized visuals, rhythmic cutting, artistic lighting, creative transitions, music-driven pacing',
            directives: {
                camera: 'Creative camera angles, spinning shots, dutch angles, abstract framing, dynamic movement synced to beat',
                editing: 'Rhythmic cuts matching music, creative transitions, jump cuts, fast montage',
                visualFx: 'Color grading, light leaks, kaleidoscope effects, glitch effects, creative overlays'
            },
            description: 'Stylized music video aesthetic with creative effects'
        }
    ]
};

export default function AdminModelManagement() {
    const [models, setModels] = useState([]);
    const [selectedModel, setSelectedModel] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');

    const [formData, setFormData] = useState({
        model_name: '',
        provider: 'openai',
        model_type: 'llm',
        tier_access: ['free'],
        is_active: true,
        is_default_for_tier: { free: false, pro: false, enterprise: false },
        cost_per_unit: 0,
        api_parameters: '{}',
        description: '',
        quality_rating: 'good',
        estimated_time: ''
    });

    useEffect(() => {
        loadModels();
    }, []);

    const loadModels = async () => {
        setIsLoading(true);
        try {
            const allModels = await base44.entities.AIModelConfig.list('-updated_date');
            setModels(allModels);
        } catch (err) {
            console.error('Error loading models:', err);
            setError('Failed to load models');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectModel = (model) => {
        setSelectedModel(model);
        setFormData({
            model_name: model.model_name,
            provider: model.provider,
            model_type: model.model_type,
            tier_access: model.tier_access || ['free'],
            is_active: model.is_active,
            is_default_for_tier: model.is_default_for_tier || { free: false, pro: false, enterprise: false },
            cost_per_unit: model.cost_per_unit || 0,
            api_parameters: typeof model.api_parameters === 'string' 
                ? model.api_parameters 
                : JSON.stringify(model.api_parameters || {}, null, 2),
            description: model.description || '',
            quality_rating: model.quality_rating || 'good',
            estimated_time: model.estimated_time || ''
        });
        setIsEditing(false);
        setIsCreating(false);
    };

    const handleCreateNew = () => {
        setSelectedModel(null);
        setFormData({
            model_name: '',
            provider: 'openai',
            model_type: 'llm',
            tier_access: ['free'],
            is_active: true,
            is_default_for_tier: { free: false, pro: false, enterprise: false },
            cost_per_unit: 0,
            api_parameters: '{}',
            description: '',
            quality_rating: 'good',
            estimated_time: ''
        });
        setIsCreating(true);
        setIsEditing(true);
    };

    const handleLoadTemplate = (template) => {
        setFormData({
            ...formData,
            model_name: template.model_name,
            provider: template.provider,
            description: template.description,
            quality_rating: template.quality_rating,
            estimated_time: template.estimated_time,
            cost_per_unit: template.cost_per_unit,
            api_parameters: JSON.stringify(template.api_parameters, null, 2)
        });
    };

    const handleEdit = () => {
        setIsEditing(true);
        setIsCreating(false);
    };

    const handleCancel = () => {
        if (selectedModel) {
            handleSelectModel(selectedModel);
        }
        setIsEditing(false);
        setIsCreating(false);
    };

    const handleSave = async () => {
        setError('');
        setSuccess('');

        if (!formData.model_name.trim()) {
            setError('Model name is required');
            return;
        }

        let apiParams;
        try {
            apiParams = JSON.parse(formData.api_parameters);
        } catch (e) {
            setError('Invalid JSON in API Parameters');
            return;
        }

        try {
            const dataToSave = {
                ...formData,
                api_parameters: apiParams
            };

            if (isCreating) {
                const newModel = await base44.entities.AIModelConfig.create(dataToSave);
                setSelectedModel(newModel);
                setSuccess('Model created successfully!');
            } else if (selectedModel) {
                const updatedModel = await base44.entities.AIModelConfig.update(selectedModel.id, dataToSave);
                setSelectedModel(updatedModel);
                setSuccess('Model updated successfully!');
            }

            setIsEditing(false);
            setIsCreating(false);
            await loadModels();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error saving model:', err);
            setError('Failed to save model: ' + err.message);
        }
    };

    const handleDelete = async (modelId) => {
        if (!window.confirm('Are you sure you want to delete this model? This cannot be undone.')) return;

        try {
            await base44.entities.AIModelConfig.delete(modelId);
            setSuccess('Model deleted successfully!');
            if (selectedModel?.id === modelId) {
                setSelectedModel(null);
            }
            await loadModels();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error deleting model:', err);
            setError('Failed to delete model');
        }
    };

    const handleToggleActive = async (model) => {
        try {
            const updated = await base44.entities.AIModelConfig.update(model.id, { 
                is_active: !model.is_active 
            });
            setSuccess(`Model ${updated.is_active ? 'activated' : 'deactivated'}!`);
            await loadModels();
            if (selectedModel && selectedModel.id === model.id) {
                setSelectedModel(updated);
            }
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error toggling model:', err);
            setError('Failed to toggle model status');
        }
    };

    const handleCopy = (model) => {
        setFormData({
            model_name: `${model.model_name} (Copy)`,
            provider: model.provider,
            model_type: model.model_type,
            tier_access: model.tier_access || ['free'],
            is_active: false,
            is_default_for_tier: { free: false, pro: false, enterprise: false },
            cost_per_unit: model.cost_per_unit || 0,
            api_parameters: typeof model.api_parameters === 'string'
                ? model.api_parameters
                : JSON.stringify(model.api_parameters || {}, null, 2),
            description: model.description || '',
            quality_rating: model.quality_rating || 'good',
            estimated_time: model.estimated_time || ''
        });
        setSelectedModel(null);
        setIsCreating(true);
        setIsEditing(true);
    };

    const handleApplyStylePreset = (preset) => {
        let currentParams;
        try {
            currentParams = JSON.parse(formData.api_parameters);
        } catch (e) {
            currentParams = {};
        }

        if (formData.model_type === 'image') {
            currentParams.style_keywords = preset.keywords;
            currentParams.style_description = preset.description;
        } else if (formData.model_type === 'video') {
            currentParams.style_keywords = preset.keywords;
            currentParams.camera_directives = preset.directives?.camera || '';
            currentParams.editing_directives = preset.directives?.editing || '';
            currentParams.visual_fx = preset.directives?.visualFx || '';
        }

        setFormData({
            ...formData,
            api_parameters: JSON.stringify(currentParams, null, 2)
        });
    };

    const handleTierToggle = (tier) => {
        const current = formData.tier_access || [];
        const updated = current.includes(tier)
            ? current.filter(t => t !== tier)
            : [...current, tier];
        setFormData({ ...formData, tier_access: updated });
    };

    const handleDefaultTierToggle = (tier) => {
        setFormData({
            ...formData,
            is_default_for_tier: {
                ...formData.is_default_for_tier,
                [tier]: !formData.is_default_for_tier[tier]
            }
        });
    };

    const filteredModels = activeTab === 'all' 
        ? models 
        : models.filter(m => m.model_type === activeTab);

    const getIconForType = (type) => {
        const typeObj = MODEL_TYPES.find(t => t.value === type);
        return typeObj ? typeObj.icon : Cpu;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-center items-center min-h-[400px]">
                        <div className="w-12 h-12 border-4 border-amber-400 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">Loading models...</p>
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
                            AI Model Management
                        </h1>
                        <p className="text-slate-600 mt-2">Configure AI models and styling presets (October 2025)</p>
                    </div>
                    <Button
                        onClick={handleCreateNew}
                        className="bg-gradient-to-r from-amber-500 to-orange-500"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Model
                    </Button>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-4"
                        >
                            <Alert className="border-red-500 bg-red-50">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-red-700">{error}</AlertDescription>
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
                            <Alert className="border-green-500 bg-green-50">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <AlertDescription className="text-green-700">{success}</AlertDescription>
                            </Alert>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Model Library */}
                    <Card className="bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Model Library</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
                                <TabsList className="grid grid-cols-3 w-full">
                                    <TabsTrigger value="all">All</TabsTrigger>
                                    <TabsTrigger value="llm">
                                        <Cpu className="w-4 h-4 mr-1" />
                                        LLM
                                    </TabsTrigger>
                                    <TabsTrigger value="image">
                                        <ImageIcon className="w-4 h-4 mr-1" />
                                        Image
                                    </TabsTrigger>
                                </TabsList>
                                <TabsList className="grid grid-cols-2 w-full mt-2">
                                    <TabsTrigger value="tts">
                                        <Mic className="w-4 h-4 mr-1" />
                                        TTS
                                    </TabsTrigger>
                                    <TabsTrigger value="video">
                                        <Video className="w-4 h-4 mr-1" />
                                        Video
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>

                            <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                {filteredModels.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-4">
                                        No models in this category
                                    </p>
                                ) : (
                                    filteredModels.map((model) => {
                                        const Icon = getIconForType(model.model_type);
                                        return (
                                            <div
                                                key={model.id}
                                                className={`
                                                    p-3 rounded-lg border cursor-pointer transition-all
                                                    ${selectedModel?.id === model.id
                                                        ? 'border-amber-400 bg-amber-50'
                                                        : 'border-gray-200 bg-white hover:border-amber-300'
                                                    }
                                                `}
                                                onClick={() => handleSelectModel(model)}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Icon className="w-4 h-4 text-gray-600 flex-shrink-0" />
                                                            <h4 className="text-sm font-medium text-gray-900 truncate">
                                                                {model.model_name}
                                                            </h4>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mb-2">
                                                            {model.provider} • {model.quality_rating}
                                                        </p>
                                                        <div className="flex gap-1 flex-wrap">
                                                            {model.is_active && (
                                                                <Badge className="bg-green-100 text-green-700 text-xs">
                                                                    Active
                                                                </Badge>
                                                            )}
                                                            {model.tier_access?.map(tier => (
                                                                <Badge key={tier} variant="outline" className="text-xs">
                                                                    {tier}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1 flex-shrink-0">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCopy(model);
                                                            }}
                                                            className="h-7 w-7"
                                                        >
                                                            <Copy className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Model Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>
                                        {isCreating ? 'Create New Model' : selectedModel ? 'Model Details' : 'Model Configuration'}
                                    </CardTitle>
                                    {selectedModel && !isEditing && (
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleToggleActive(selectedModel)}
                                            >
                                                {selectedModel.is_active ? (
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
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(selectedModel.id)}
                                                className="text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {!selectedModel && !isCreating ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Settings className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No model selected</h3>
                                        <p className="text-sm text-gray-500">
                                            Select a model from the list or create a new one
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {isCreating && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    <Zap className="w-4 h-4 inline mr-1" />
                                                    Quick Start: Load Model Template (October 2025)
                                                </label>
                                                <div className="grid grid-cols-2 gap-2 mb-4">
                                                    {MODEL_TEMPLATES_2025[formData.model_type]?.map((template, idx) => (
                                                        <Button
                                                            key={idx}
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleLoadTemplate(template)}
                                                            className="justify-start text-left h-auto py-2"
                                                        >
                                                            <div>
                                                                <div className="font-medium text-xs">{template.model_name}</div>
                                                                <div className="text-xs text-gray-500 mt-0.5">
                                                                    {template.provider} • {template.quality_rating}
                                                                </div>
                                                            </div>
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Model Name *
                                                </label>
                                                <Input
                                                    value={formData.model_name}
                                                    onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                                                    disabled={!isEditing}
                                                    placeholder="e.g., GPT-4o, Runway Gen-3, DALL-E 3"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Provider *
                                                </label>
                                                <Select
                                                    value={formData.provider}
                                                    onValueChange={(value) => setFormData({ ...formData, provider: value })}
                                                    disabled={!isEditing}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {MODEL_PROVIDERS.map((provider) => (
                                                            <SelectItem key={provider.value} value={provider.value}>
                                                                {provider.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Model Type *
                                                </label>
                                                <Select
                                                    value={formData.model_type}
                                                    onValueChange={(value) => setFormData({ ...formData, model_type: value })}
                                                    disabled={!isEditing}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {MODEL_TYPES.map((type) => (
                                                            <SelectItem key={type.value} value={type.value}>
                                                                {type.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Quality Rating
                                                </label>
                                                <Select
                                                    value={formData.quality_rating}
                                                    onValueChange={(value) => setFormData({ ...formData, quality_rating: value })}
                                                    disabled={!isEditing}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {QUALITY_RATINGS.map((rating) => (
                                                            <SelectItem key={rating.value} value={rating.value}>
                                                                {rating.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Cost Per Unit ($)
                                                </label>
                                                <Input
                                                    type="number"
                                                    step="0.001"
                                                    value={formData.cost_per_unit}
                                                    onChange={(e) => setFormData({ ...formData, cost_per_unit: parseFloat(e.target.value) || 0 })}
                                                    disabled={!isEditing}
                                                    placeholder="0.00"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Estimated Time
                                                </label>
                                                <Input
                                                    value={formData.estimated_time}
                                                    onChange={(e) => setFormData({ ...formData, estimated_time: e.target.value })}
                                                    disabled={!isEditing}
                                                    placeholder="e.g., 30 seconds, 2-5 minutes"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Description
                                            </label>
                                            <Textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                disabled={!isEditing}
                                                placeholder="Describe what this model does and its best use cases..."
                                                className="h-20"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Tier Access
                                            </label>
                                            <div className="flex gap-3">
                                                {['free', 'pro', 'enterprise'].map((tier) => (
                                                    <Button
                                                        key={tier}
                                                        type="button"
                                                        variant={formData.tier_access?.includes(tier) ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => isEditing && handleTierToggle(tier)}
                                                        disabled={!isEditing}
                                                        className={formData.tier_access?.includes(tier) ? "bg-amber-500" : ""}
                                                    >
                                                        {tier.charAt(0).toUpperCase() + tier.slice(1)}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Default for Tier
                                            </label>
                                            <div className="flex gap-3">
                                                {['free', 'pro', 'enterprise'].map((tier) => (
                                                    <Button
                                                        key={tier}
                                                        type="button"
                                                        variant={formData.is_default_for_tier?.[tier] ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => isEditing && handleDefaultTierToggle(tier)}
                                                        disabled={!isEditing}
                                                        className={formData.is_default_for_tier?.[tier] ? "bg-green-500" : ""}
                                                    >
                                                        {tier.charAt(0).toUpperCase() + tier.slice(1)}
                                                    </Button>
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Set as the default model for each tier
                                            </p>
                                        </div>

                                        {isEditing && (formData.model_type === 'image' || formData.model_type === 'video') && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    <Sparkles className="w-4 h-4 inline mr-1" />
                                                    Quick Apply Style Preset
                                                </label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {STYLE_PRESETS[formData.model_type]?.map((preset, idx) => (
                                                        <Button
                                                            key={idx}
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleApplyStylePreset(preset)}
                                                            className="justify-start text-left h-auto py-2"
                                                        >
                                                            <div>
                                                                <div className="font-medium text-xs">{preset.name}</div>
                                                                <div className="text-xs text-gray-500 mt-0.5">
                                                                    {preset.description}
                                                                </div>
                                                            </div>
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                API Parameters (JSON)
                                            </label>
                                            <Textarea
                                                value={formData.api_parameters}
                                                onChange={(e) => setFormData({ ...formData, api_parameters: e.target.value })}
                                                disabled={!isEditing}
                                                placeholder='{"temperature": 0.7, "max_tokens": 1000}'
                                                className="h-64 font-mono text-sm"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Model-specific parameters in JSON format. Can include style_keywords, directives, etc.
                                            </p>
                                        </div>

                                        {isEditing && (
                                            <div className="flex gap-3 pt-4">
                                                <Button
                                                    onClick={handleSave}
                                                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500"
                                                >
                                                    <Save className="w-4 h-4 mr-2" />
                                                    {isCreating ? 'Create Model' : 'Save Changes'}
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

                        {/* Style Preset Reference */}
                        <Card className="bg-blue-50/50 border-blue-200">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-blue-600" />
                                    Style Preset Examples (October 2025)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4 text-sm">
                                    <div>
                                        <h4 className="font-semibold text-blue-900 mb-2">Image Styles</h4>
                                        <p className="text-blue-700 text-xs mb-2">
                                            Use style_keywords in API parameters to guide image generation
                                        </p>
                                        <div className="space-y-1">
                                            {STYLE_PRESETS.image.slice(0, 3).map((preset, idx) => (
                                                <div key={idx} className="text-xs p-2 bg-blue-100 rounded">
                                                    <strong>{preset.name}:</strong> {preset.keywords.split(',').slice(0, 4).join(',')}...
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-blue-900 mb-2">Video Directives</h4>
                                        <p className="text-blue-700 text-xs mb-2">
                                            Add camera_directives, editing_directives, visual_fx to control video style
                                        </p>
                                        <div className="space-y-1">
                                            {STYLE_PRESETS.video.slice(0, 3).map((preset, idx) => (
                                                <div key={idx} className="text-xs p-2 bg-blue-100 rounded">
                                                    <strong>{preset.name}:</strong> Camera: {preset.directives?.camera?.split(',')[0]}...
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
