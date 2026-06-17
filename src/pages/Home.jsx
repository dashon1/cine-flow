import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Download, Wand2, Video, ChevronRight, Film, FileText, Upload, Settings as SettingsIcon, Mic, Image as ImageIcon, Music } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";

// Long video renders run as async backend jobs; poll until the URL is ready.
async function pollVideoJob(jobId, maxMs = 360000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    await new Promise((r) => setTimeout(r, 5000));
    const s = await base44.functions.invoke('getVideoJob', { job_id: jobId });
    if (s.data?.status === 'done') return s.data.video_url;
    if (s.data?.status === 'error') throw new Error(s.data.error || 'video generation failed');
  }
  throw new Error('video generation timed out');
}
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

import SpeechToText from '../components/video/SpeechToText';
import ImageUploadCard from '../components/video/ImageUploadCard';
import StoryboardEditor from '../components/video/StoryboardEditor';
import VoiceSettings from '../components/video/VoiceSettings';
import MusicSelector from '../components/video/MusicSelector';
import ExportSettings from '../components/video/ExportSettings';
import ProjectManager from '../components/video/ProjectManager';
import WelcomeTutorial from '../components/onboarding/WelcomeTutorial';
import BrowserCompatibilityNotice from '../components/common/BrowserCompatibilityNotice';
import RateLimitNotice from '../components/common/RateLimitNotice';
import VideoGenerationModeSelector from '../components/video/VideoGenerationModeSelector';
import FAQChatbot from '../components/chatbot/FAQChatbot';
import WorkflowStepControl from '../components/video/WorkflowStepControl';
import SavedVideosManager from '../components/video/SavedVideosManager';
import ModelSelector from '../components/video/ModelSelector';

const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇺🇸', label: 'English 🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸', label: 'Spanish 🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷', label: 'French 🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪', label: 'German 🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹', label: 'Italian 🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹', label: 'Portuguese 🇵🇹' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺', label: 'Russian 🇷🇺' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵', label: 'Japanese 🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷', label: 'Korean 🇰🇷' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳', label: 'Chinese 🇨🇳' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳', label: 'Hindi 🇮🇳' },
    { code: 'ta', name: 'Tamil', flag: '🇮🇳', label: 'Tamil 🇮🇳' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦', label: 'Arabic 🇸🇦' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷', label: 'Turkish 🇹🇷' },
    { code: 'nl', name: 'Dutch', flag: '🇳🇱', label: 'Dutch 🇳🇱' }
];

const SLIDE_EFFECTS = [
    'zoom-in', 'zoom-out', 'pan-left', 'pan-right', 'fade-in', 'fade-out'
];

export default function Home() {
    const [script, setScript] = useState('');
    const [language, setLanguage] = useState('en');
    const [referenceImageUrl, setReferenceImageUrl] = useState(null);
    const [isUploadingReference, setIsUploadingReference] = useState(false);

    const [currentStep, setCurrentStep] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTask, setCurrentTask] = useState('');
    const [storyboard, setStoryboard] = useState(null);
    const [generatedImages, setGeneratedImages] = useState([]);
    const [error, setError] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);
    const [audioData, setAudioData] = useState([]);
    const [generatedVideoBlob, setGeneratedVideoBlob] = useState(null);
    const [voiceovers, setVoiceovers] = useState([]);
    const [showSettings, setShowSettings] = useState(false);

    const [projectSettings, setProjectSettings] = useState({
        aspect_ratio: '16:9',
        resolution: '1080p',
        voice_type: 'default',
        voice_speed: 1.0,
        voice_pitch: 1.0,
        voice_provider: 'browser',
        background_music: null,
        music_volume: 0.3,
        selected_llm_model: null,
        selected_image_model: null,
        selected_voice_model: null,
        video_generation_mode: 'canvas',
        reference_strength: 0.85
    });

    const [currentProject, setCurrentProject] = useState(null);
    const [selectedMusicTrack, setSelectedMusicTrack] = useState(null);

    const [userSettings, setUserSettings] = useState(null);
    const [dailyUsage, setDailyUsage] = useState({ current: 0, limit: 10 });
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);
    const [showTutorial, setShowTutorial] = useState(false);
    const [isBrowserCompatible, setIsBrowserCompatible] = useState(true);

    const [availableModels, setAvailableModels] = useState({
        llm: [],
        image: [],
        tts: [],
        video: []
    });
    const [userTier, setUserTier] = useState('free');

    const steps = [
        { number: 1, title: 'Input', icon: FileText },
        { number: 2, title: 'AI Analysis', icon: Wand2 },
        { number: 3, title: 'Generate Visuals', icon: Film },
        { number: 4, title: 'Create Voiceover', icon: Mic },
        { number: 5, title: 'Final Video', icon: Video }
    ];

    const [workflowStep, setWorkflowStep] = useState(1);
    const [stepStatuses, setStepStatuses] = useState({
        1: 'current',
        2: 'pending',
        3: 'pending',
        4: 'pending',
        5: 'pending'
    });

    const [hasSelectedStoryboardModel, setHasSelectedStoryboardModel] = useState(false);
    const [hasSelectedImageModel, setHasSelectedImageModel] = useState(false);
    const [hasSelectedVoiceModel, setHasSelectedVoiceModel] = useState(false);
    const [hasSelectedVideoModel, setHasSelectedVideoModel] = useState(false);
    const [regeneratingSceneIndex, setRegeneratingSceneIndex] = useState(null);
    const [regeneratingVoiceIndex, setRegeneratingVoiceIndex] = useState(null);
    const [projectName, setProjectName] = useState('');
    const [savedVideosKey, setSavedVideosKey] = useState(0);

    const saveVideoToProfile = async (videoBlob, mode, directUrl = null) => {
        try {
            const user = await base44.auth.me();
            let savedUrl = directUrl;
            let fileSize = null;

            if (videoBlob) {
                fileSize = videoBlob.size;
                const ext = videoBlob.type.includes('mp4') ? 'mp4' : 'webm';
                const path = `cutsflow/videos/${user.id}/${Date.now()}.${ext}`;
                const { error: uploadError } = await base44.supabase.storage
                    .from('uploads')
                    .upload(path, videoBlob, { cacheControl: '3600', upsert: false, contentType: videoBlob.type });
                if (uploadError) throw uploadError;
                const { data: urlData } = base44.supabase.storage.from('uploads').getPublicUrl(path);
                savedUrl = urlData.publicUrl;
            }

            const scenes = storyboard?.scenes || generatedImages;
            const totalDuration = scenes.reduce((sum, s) => sum + (s.duration || 5), 0);
            const thumbnailUrl = generatedImages[0]?.url || null;

            await base44.entities.GeneratedVideo.create({
                title: projectName || 'Untitled Video',
                video_url: savedUrl,
                thumbnail_url: thumbnailUrl,
                status: 'completed',
                resolution: projectSettings.resolution || '720p',
                aspect_ratio: projectSettings.aspect_ratio || '16:9',
                duration: totalDuration,
                file_size: fileSize,
                generation_mode: mode,
                scenes_count: generatedImages.length,
                created_by: user.email,
            });

            setSavedVideosKey(k => k + 1);
        } catch (err) {
            console.error('Failed to save video to profile:', err);
        }
    };

    const getActivePrompt = async (promptType) => {
        try {
            const prompts = await base44.entities.SystemPrompt.filter({
                prompt_type: promptType,
                is_active: true
            });

            if (prompts.length > 0) {
                return prompts[0];
            }

            return null;
        } catch (err) {
            console.error('Error fetching prompt:', err);
            return null;
        }
    };

    const fillPromptTemplate = (template, variables) => {
        let filledPrompt = template;
        for (const [key, value] of Object.entries(variables)) {
            filledPrompt = filledPrompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        }
        return filledPrompt;
    };

    const getCanvasDimensions = (aspectRatio, resolution) => {
        const baseHeight = resolution === '1080p' ? 1080 : 720;

        switch (aspectRatio) {
            case '16:9':
                return { width: Math.round(baseHeight * 16 / 9), height: baseHeight };
            case '9:16':
                return { width: Math.round(baseHeight * 9 / 16), height: baseHeight };
            case '1:1':
                return { width: baseHeight, height: baseHeight };
            case '4:3':
                return { width: Math.round(baseHeight * 4 / 3), height: baseHeight };
            default:
                return { width: 1280, height: 720 };
        }
    };

    const handleSpeechTranscript = (transcript) => {
        setScript(prev => prev + transcript + ' ');
    };

    const handleReferenceImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploadingReference(true);
        setError('');
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            setReferenceImageUrl(file_url);
        } catch (err) {
            setError('Failed to upload reference image');
            console.error('Reference image upload error:', err);
        } finally {
            setIsUploadingReference(false);
        }
    };



    const regenerateVoiceover = async (sceneIndex, useTestKey = false) => {
        console.log('=== REGENERATE VOICEOVER DEBUG ===');
        console.log('Scene index:', sceneIndex);
        console.log('Selected voice model:', projectSettings.selected_voice_model);

        if (!storyboard || !storyboard.scenes) {
            const errMsg = 'Cannot regenerate voiceover - missing storyboard';
            console.error(errMsg);
            setError(errMsg);
            return;
        }

        if (!projectSettings.selected_voice_model) {
            const errMsg = 'Please select a voice model first';
            console.error(errMsg);
            setError(errMsg);
            return;
        }

        setRegeneratingVoiceIndex(sceneIndex);
        setError('');

        try {
            const scene = storyboard.scenes[sceneIndex];
            console.log('Scene data:', scene);

            const selectedVoiceModel = availableModels.tts.find(m => m.id === projectSettings.selected_voice_model);
            console.log('Voice model:', selectedVoiceModel);

            if (!scene.dialogue || !scene.dialogue.trim()) {
                const errMsg = `No dialogue in scene ${sceneIndex + 1}`;
                console.error(errMsg);
                setError(errMsg);
                setRegeneratingVoiceIndex(null);
                return;
            }

            // Check if browser TTS is selected
            if (selectedVoiceModel && selectedVoiceModel.provider === 'browser') {
                const errMsg = 'Browser TTS cannot generate audio files for videos. Please select Google TTS or ElevenLabs for voiceover generation.';
                console.error(errMsg);
                setError(errMsg);
                setRegeneratingVoiceIndex(null);
                return;
            }

            let audioBlob = null;
            let audioUrl = null;
            let sceneError = null;

            if (selectedVoiceModel && selectedVoiceModel.provider === 'google') {
                console.log('Using Google TTS...');
                const voiceName = selectedVoiceModel.api_parameters?.voice_name || 'en-US-Neural2-C';
                const languageCode = selectedVoiceModel.api_parameters?.language_code || language || 'en-US';

                const response = await base44.functions.invoke('generateVoiceGoogle', {
                    text: scene.dialogue,
                    voice_name: voiceName,
                    language_code: languageCode
                });

                console.log('Google TTS response:', response);
                let audioResp = response instanceof Blob ? response : response?.data;
                if (audioResp && !(audioResp instanceof Blob) && audioResp.audio_url) {
                    audioResp = await fetch(audioResp.audio_url).then(r => r.blob());
                }
                if (audioResp instanceof Blob && audioResp.size > 0) {
                    audioBlob = audioResp;
                    audioUrl = URL.createObjectURL(audioBlob);
                    console.log('✓ Google TTS audio created:', audioBlob.size, 'bytes');
                } else {
                    console.error('❌ Google TTS returned invalid audio');
                }
            } else if (selectedVoiceModel && selectedVoiceModel.provider === 'elevenlabs') {
                console.log('Using ElevenLabs TTS...');
                const response = await base44.functions.invoke('generateVoiceElevenLabs', {
                    text: scene.dialogue,
                    voice_id: selectedVoiceModel.api_parameters?.voice_id || 'default',
                    model_id: selectedVoiceModel.model_name || 'eleven_multilingual_v2',
                    use_test_key: useTestKey
                });

                console.log('ElevenLabs response:', response);
                let audioResp = response instanceof Blob ? response : response?.data;
                if (audioResp && !(audioResp instanceof Blob) && audioResp.audio_url) {
                    audioResp = await fetch(audioResp.audio_url).then(r => r.blob());
                }
                if (audioResp instanceof Blob && audioResp.size > 0) {
                    audioBlob = audioResp;
                    audioUrl = URL.createObjectURL(audioBlob);
                    console.log('✓ ElevenLabs audio created:', audioBlob.size, 'bytes');
                } else {
                    console.error('❌ ElevenLabs returned invalid audio');
                }
            } else {
                console.error('❌ No valid voice provider selected');
                setError('Please select a valid voice model (Google TTS or ElevenLabs)');
                setRegeneratingVoiceIndex(null);
                return;
            }

            const words = scene.dialogue.split(' ').filter(w => w.length > 0);
            const avgWordsPerSecond = 2.2;
            let currentTime = 0;
            const wordTimings = words.map((word) => {
                const cleanWord = word.replace(/[^\w'-]/g, '');
                const duration = cleanWord.length > 0 ? (1 / avgWordsPerSecond) : 0;
                const startTime = currentTime;
                const endTime = startTime + duration;
                currentTime = endTime;
                return {
                    word: cleanWord,
                    start_time: startTime,
                    end_time: endTime
                };
            }).filter(wt => wt.word.length > 0);

            console.log('Updating voiceover at index:', sceneIndex);
            setVoiceovers(prev => prev.map((vo, idx) =>
                idx === sceneIndex ? {
                    scene_number: scene.scene_number,
                    dialogue: scene.dialogue,
                    duration: scene.duration || 5,
                    estimated_duration: scene.duration || 5,
                    language: language,
                    wordTimings: wordTimings,
                    audioBlob: audioBlob,
                    audioUrl: audioUrl,
                    error: sceneError
                } : vo
            ));

            console.log('✓ Voiceover regenerated successfully');

        } catch (err) {
            console.error('❌ Failed to regenerate voiceover:', err);
            setError(`Failed to regenerate voiceover: ${err.message}`);
        } finally {
            setRegeneratingVoiceIndex(null);
        }
    };

    const regenerateScene = async (sceneIndex) => {
        if (!storyboard || !storyboard.scenes || !projectSettings.selected_image_model) {
            setError('Cannot regenerate scene - missing storyboard or model selection');
            return;
        }

        setRegeneratingSceneIndex(sceneIndex);
        setError('');

        try {
            const scene = storyboard.scenes[sceneIndex];
            const promptConfig = await getActivePrompt('image_generation');
            const selectedImageModel = availableModels.image.find(m => m.id === projectSettings.selected_image_model);

            let imagePrompt;
            if (promptConfig && promptConfig.prompt_template) {
                imagePrompt = fillPromptTemplate(promptConfig.prompt_template, {
                    visual_description: scene.visual_description,
                    mood: scene.mood,
                    camera_angle: scene.camera_angle
                });
            } else {
                imagePrompt = `Create a high-quality, cinematic image for this scene: ${scene.visual_description}. Mood: ${scene.mood}. Camera: ${scene.camera_angle}`;
            }

            let imageResult;
            try {
                if (selectedImageModel && selectedImageModel.provider === 'google') {
                    const googleResponse = await base44.functions.invoke('generateImageGoogle', {
                        prompt: imagePrompt,
                        model: selectedImageModel.model_name,
                        aspect_ratio: projectSettings.aspect_ratio
                    });
                    imageResult = googleResponse?.data || googleResponse;
                } else if (selectedImageModel && selectedImageModel.provider === 'fal_ai') {
                    const falResponse = await base44.functions.invoke('generateImageFal', {
                        prompt: imagePrompt,
                        model: selectedImageModel.model_name,
                        image_size: projectSettings.aspect_ratio === '16:9' ? 'landscape_16_9' :
                            projectSettings.aspect_ratio === '9:16' ? 'portrait_9_16' : 'square',
                        reference_image_url: referenceImageUrl,
                        parameters: { reference_strength: projectSettings.reference_strength }
                    });
                    imageResult = falResponse?.data || falResponse;
                } else {
                    imageResult = await base44.integrations.Core.GenerateImage({ prompt: imagePrompt });
                }
            } catch (providerErr) {
                console.warn(`Image provider failed, falling back to Core.GenerateImage:`, providerErr?.message);
                imageResult = await base44.integrations.Core.GenerateImage({ prompt: imagePrompt });
            }

            const imageUrl = imageResult?.url || imageResult?.file_url;
            if (imageUrl) {
                setGeneratedImages(prev => prev.map((img, idx) =>
                    idx === sceneIndex ? {
                        ...img,
                        url: imageUrl,
                        description: scene.visual_description
                    } : img
                ));
            }
        } catch (err) {
            console.error('Failed to regenerate scene:', err);
            setError(`Failed to regenerate scene ${sceneIndex + 1}: ${err?.message || 'Unknown error'}`);
        } finally {
            setRegeneratingSceneIndex(null);
        }
    };



    const incrementUsageCount = async () => {
        if (!userSettings || userSettings.id === 'guest') {
            setDailyUsage(prev => ({ ...prev, current: prev.current + 1 }));
            return;
        }

        const newCount = dailyUsage.current + 1;
        const today = new Date().toISOString().split('T')[0];

        try {
            const updatedSettings = await base44.entities.UserSettings.update(userSettings.id, {
                daily_generations_count: newCount,
                last_generation_date: today
            });

            setDailyUsage({ ...dailyUsage, current: newCount });
            setUserSettings(updatedSettings);
        } catch (err) {
            console.error('Failed to update usage count:', err);
            setDailyUsage(prev => ({ ...prev, current: prev.current + 1 }));
            setError('Failed to update usage count in database, local count updated.');
        }
    };

    const checkRateLimit = () => {
        if (isLoadingSettings) {
            console.log('Rate limit check deferred: settings still loading.');
            return false;
        }
        return dailyUsage.current < dailyUsage.limit;
    };

    const handleStepComplete = (step) => {
        setStepStatuses(prev => ({
            ...prev,
            [step]: 'completed',
            [step + 1]: 'current'
        }));
        setWorkflowStep(step + 1);
    };

    const handleProceedToImages = async () => {
        if (!storyboard || !storyboard.scenes || storyboard.scenes.length === 0) {
            setError('Please generate a storyboard first');
            return;
        }

        if (!projectSettings.selected_image_model) {
            setError('Please select an image generation model before proceeding');
            return;
        }

        setError('');
        handleStepComplete(1);

        setIsProcessing(true);
        await generateImages(storyboard);
        setIsProcessing(false);
    };

    const handleProceedToVoiceovers = async () => {
        if (generatedImages.length === 0) {
            setError('Please generate images first');
            return;
        }

        if (!projectSettings.selected_voice_model) {
            setError('Please select a voice/TTS model before proceeding');
            return;
        }

        setError('');
        handleStepComplete(2);

        setIsProcessing(true);
        await createVoiceover(storyboard, generatedImages);
        setIsProcessing(false);
    };

    const handleProceedToMusic = () => {
        if (voiceovers.length === 0) {
            setError('Please generate voiceovers first');
            return;
        }

        setError('');
        handleStepComplete(3);
    };

    const handleProceedToFinalVideo = async () => {
        setError('');
        handleStepComplete(4);

        setIsProcessing(true);
        await assembleVideo(generatedImages, voiceovers);
        setIsProcessing(false);
    };



    const handleScriptUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = (e) => setScript(e.target.result);
            reader.readAsText(file);
        }
    };

    const detectDurationFromScript = (text) => {
        const durationPatterns = [
            /(\d+)\s*min(?:ute)?s?/i,
            /(\d+)\s*sec(?:ond)?s?/i,
            /(\d+):(\d+)/,
            /duration[:\s]+(\d+)/i
        ];

        for (const pattern of durationPatterns) {
            const match = text.match(pattern);
            if (match) {
                if (pattern.source.includes('min')) {
                    return parseInt(match[1]) * 60;
                } else if (pattern.source.includes('sec')) {
                    return parseInt(match[1]);
                } else if (pattern.source.includes(':')) {
                    return parseInt(match[1]) * 60 + parseInt(match[2]);
                } else {
                    return parseInt(match[1]);
                }
            }
        }

        const wordCount = text.split(/\s+/).length;
        const estimatedSeconds = Math.ceil(wordCount / 2.2);
        return estimatedSeconds;
    };

    const calculateOptimalSceneCount = (totalDuration, selectedModel) => {
        if (!selectedModel) return Math.max(6, Math.ceil(totalDuration / 5));

        const modelCost = selectedModel.cost_per_unit || 0.05;

        let optimalSceneDuration;
        if (modelCost <= 0.03) {
            optimalSceneDuration = 8;
        } else if (modelCost <= 0.06) {
            optimalSceneDuration = 6;
        } else {
            optimalSceneDuration = 5;
        }

        const sceneCount = Math.max(4, Math.ceil(totalDuration / optimalSceneDuration));
        return Math.min(sceneCount, 15);
    };

    const generateStoryboard = async () => {
        if (!script.trim() || !language) {
            setError('Please provide a script and select a language');
            return;
        }

        if (!checkRateLimit()) {
            setError(`You have reached your daily video limit (${dailyUsage.limit}). Please try again tomorrow.`);
            return;
        }

        if (!projectSettings.selected_llm_model) {
            setError('Please select an AI model for storyboard generation');
            return;
        }

        setIsProcessing(true);
        setError('');
        setCurrentStep(2);
        setProgress(10);
        setCurrentTask('Analyzing script and creating storyboard...');

        try {
            const selectedLLMModel = availableModels.llm.find(m => m.id === projectSettings.selected_llm_model);

            if (!selectedLLMModel) {
                throw new Error('No LLM model selected. Please select an AI model.');
            }

            const supportsTimestamps = selectedLLMModel.supports_timestamps || false;

            const detectedDuration = detectDurationFromScript(script);
            const selectedImageModel = availableModels.image.find(m => m.id === projectSettings.selected_image_model);
            const optimalSceneCount = calculateOptimalSceneCount(detectedDuration, selectedImageModel);
            const sceneDuration = Math.max(4, Math.min(8, Math.ceil(detectedDuration / optimalSceneCount)));

            console.log(`Detected duration: ${detectedDuration}s, Optimal scenes: ${optimalSceneCount}, Scene duration: ${sceneDuration}s`);

            const promptConfig = await getActivePrompt('storyboard_generation');

            let storyboardPrompt;
            if (promptConfig && promptConfig.prompt_template) {
                storyboardPrompt = fillPromptTemplate(promptConfig.prompt_template, {
                    script: script,
                    scene_count: optimalSceneCount,
                    scene_duration: sceneDuration,
                    total_duration: detectedDuration
                });
            } else {
                storyboardPrompt = `
                    Analyze this script and create a detailed storyboard breakdown.
                    Break it into scenes with visual descriptions, dialogue, and timing.
                    
                    IMPORTANT: For visual descriptions, describe ACTIONS and MOVEMENT, not just static scenes.
                    Example: Instead of "A person standing in a room", use "A person walking anxiously across a dimly lit room, hands trembling"

                    Script: "${script}"

                    DURATION REQUIREMENTS:
                    - Total video duration: ${detectedDuration} seconds
                    - Create EXACTLY ${optimalSceneCount} scenes
                    - Each scene should be approximately ${sceneDuration} seconds
                    - Adjust scene durations as needed to match the narrative pace
                    - Optionally include start_time and end_time for precise timing

                    Return ONLY valid JSON in this exact format (no markdown, no code blocks):
                    {
                        "title": "Video Title",
                        "total_duration": ${detectedDuration},
                        "scenes": [
                            {
                                "scene_number": 1,
                                ${supportsTimestamps ? '"start_time": 0,' : ''}
                                ${supportsTimestamps ? '"end_time": 5,' : ''}
                                "duration": ${sceneDuration},
                                "visual_description": "Detailed action-oriented description",
                                "dialogue": "Spoken narration text",
                                "camera_angle": "Medium shot",
                                "mood": "Energetic"
                            }
                        ]
                    }

                    Requirements:
                    - Create EXACTLY ${optimalSceneCount} scenes to cover ${detectedDuration} seconds
                    - Each scene ${sceneDuration} seconds duration (adjust slightly as needed)
                    - Visual descriptions must describe ACTIONS and MOVEMENT
                    - Dialogue should be clear and speakable
                    - Camera angles should be cinematic
                    - Duration must be a NUMBER in seconds (e.g., 5, not "0-5 seconds")
                    - Return ONLY the JSON, nothing else
                `;
            }

            console.log('Calling LLM with storyboard prompt...');
            console.log(`Using LLM: ${selectedLLMModel.provider} - ${selectedLLMModel.model_name} (ID: ${selectedLLMModel.id})`);

            const storyboardResult = await base44.functions.invoke('invokeLLMMultiProvider', {
                provider: selectedLLMModel.provider,
                model: selectedLLMModel.model_name,
                prompt: storyboardPrompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        total_duration: { type: "number" },
                        scenes: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    scene_number: { type: "number" },
                                    duration: { type: "number" },
                                    visual_description: { type: "string" },
                                    dialogue: { type: "string" },
                                    camera_angle: { type: "string" },
                                    mood: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });

            console.log('Raw function response:', JSON.stringify(storyboardResult, null, 2));

            let storyboardData = storyboardResult?.data || storyboardResult;

            console.log('Extracted storyboard data:', JSON.stringify(storyboardData, null, 2));

            if (!storyboardData) {
                console.error('No storyboard data received');
                throw new Error("No data returned from AI. Please try again.");
            }

            if (storyboardData.error) {
                console.error('Error in response:', storyboardData.error);
                throw new Error(storyboardData.error);
            }

            let scenesArray = null;

            if (storyboardData.scenes && Array.isArray(storyboardData.scenes)) {
                scenesArray = storyboardData.scenes;
            } else if (storyboardData.storyboard && Array.isArray(storyboardData.storyboard)) {
                scenesArray = storyboardData.storyboard;
            } else if (storyboardData.data && storyboardData.data.scenes && Array.isArray(storyboardData.data.scenes)) {
                scenesArray = storyboardData.data.scenes;
            } else if (storyboardData.data && storyboardData.data.storyboard && Array.isArray(storyboardData.data.storyboard)) {
                scenesArray = storyboardData.data.storyboard;
            }

            if (!scenesArray || scenesArray.length === 0) {
                console.error('No valid scenes array found:', JSON.stringify(storyboardData, null, 2));
                throw new Error("AI returned invalid storyboard format. Please try again.");
            }

            const parseDuration = (duration) => {
                if (typeof duration === 'number') return duration;
                if (typeof duration === 'string') {
                    const match = duration.match(/(\d+)/);
                    if (match) {
                        return parseInt(match[1]) || 5;
                    }
                }
                return 5;
            };

            const processedStoryboard = {
                title: storyboardData.title || "Generated Video",
                total_duration: storyboardData.total_duration || scenesArray.reduce((sum, s) => sum + parseDuration(s.duration), 0),
                scenes: scenesArray.map((scene, index) => {
                    const duration = Math.min(Math.max(parseDuration(scene.duration), 4), 8);

                    return {
                        scene_number: scene.scene_number || (index + 1),
                        duration: duration,
                        visual_description: scene.visual_description || scene.description || "Scene description",
                        dialogue: scene.dialogue || scene.dialogue_narration_text || "",
                        camera_angle: scene.camera_angle || scene.camera_angle_suggestions || "Medium shot",
                        mood: scene.mood || scene.mood_atmosphere || "Neutral",
                        effect: SLIDE_EFFECTS[index % SLIDE_EFFECTS.length]
                    };
                })
            };

            console.log('Processed Storyboard:', JSON.stringify(processedStoryboard, null, 2));

            setStoryboard(processedStoryboard);
            setProgress(25);
            setCurrentStep(2);
            setIsProcessing(false);

            await incrementUsageCount();

        } catch (err) {
            console.error('Storyboard generation error:', err);

            let errorMessage = 'Failed to generate storyboard. ';

            // Handle different error types
            if (err.response?.data?.error) {
                errorMessage += err.response.data.error;
            } else if (err.message) {
                if (err.message.includes('API_KEY')) {
                    errorMessage += 'API keys not configured. Please contact admin.';
                } else if (err.message.includes('Unauthorized')) {
                    errorMessage += 'Authentication failed. Please refresh and try again.';
                } else {
                    errorMessage += err.message;
                }
            } else {
                errorMessage += 'Please try with a shorter script.';
            }

            setError(errorMessage);
            setIsProcessing(false);
            setCurrentStep(1);
            setWorkflowStep(1);
            setStepStatuses({ 1: 'current', 2: 'pending', 3: 'pending', 4: 'pending', 5: 'pending' });
            setProgress(0);
        }
    };

    const handleStoryboardUpdate = (updatedStoryboard) => {
        setStoryboard(updatedStoryboard);
    };

    const generateImages = async (storyboardData) => {
        setCurrentTask('Generating AI images for each scene...');
        setCurrentStep(3);

        const images = [];
        const scenes = storyboardData.scenes || [];

        const promptConfig = await getActivePrompt('image_generation');
        const selectedImageModel = availableModels.image.find(m => m.id === projectSettings.selected_image_model);

        for (let i = 0; i < scenes.length; i++) {
            setProgress(25 + (i / scenes.length) * 25);
            setCurrentTask(`Generating image ${i + 1} of ${scenes.length}...`);

            let imagePrompt;
            if (promptConfig && promptConfig.prompt_template) {
                imagePrompt = fillPromptTemplate(promptConfig.prompt_template, {
                    visual_description: scenes[i].visual_description,
                    mood: scenes[i].mood,
                    camera_angle: scenes[i].camera_angle
                });
            } else {
                imagePrompt = `Create a high-quality, cinematic image for this scene: ${scenes[i].visual_description}. Mood: ${scenes[i].mood}. Camera: ${scenes[i].camera_angle}`;
            }

            try {
                let imageResult;

                const imagePromise = (async () => {
                    try {
                        if (selectedImageModel && selectedImageModel.provider === 'google') {
                            const googleResponse = await base44.functions.invoke('generateImageGoogle', {
                                prompt: imagePrompt,
                                model: selectedImageModel.model_name,
                                aspect_ratio: projectSettings.aspect_ratio
                            });
                            return googleResponse?.data || googleResponse;
                        } else if (selectedImageModel && selectedImageModel.provider === 'fal_ai') {
                            const falResponse = await base44.functions.invoke('generateImageFal', {
                                prompt: imagePrompt,
                                model: selectedImageModel.model_name,
                                image_size: projectSettings.aspect_ratio === '16:9' ? 'landscape_16_9' :
                                    projectSettings.aspect_ratio === '9:16' ? 'portrait_9_16' : 'square',
                                reference_image_url: referenceImageUrl
                            });
                            return falResponse?.data || falResponse;
                        } else {
                            return await base44.integrations.Core.GenerateImage({ prompt: imagePrompt });
                        }
                    } catch (providerErr) {
                        console.warn(`Image provider failed for scene ${i + 1}, falling back to Core.GenerateImage:`, providerErr?.message);
                        return await base44.integrations.Core.GenerateImage({ prompt: imagePrompt });
                    }
                })();

                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Image generation timeout (60s)')), 60000)
                );

                imageResult = await Promise.race([imagePromise, timeoutPromise]);
                const imageUrl = imageResult?.url || imageResult?.file_url;

                images.push({
                    scene_number: scenes[i].scene_number,
                    url: imageUrl || null,
                    description: scenes[i].visual_description,
                    duration: scenes[i].duration || 5,
                    dialogue: scenes[i].dialogue || "",
                    effect: SLIDE_EFFECTS[i % SLIDE_EFFECTS.length]
                });
            } catch (err) {
                console.error(`Failed to generate image for scene ${i + 1}:`, err);
                images.push({
                    scene_number: scenes[i].scene_number,
                    url: null,
                    description: scenes[i].visual_description,
                    duration: scenes[i].duration || 5,
                    dialogue: scenes[i].dialogue || "",
                    effect: SLIDE_EFFECTS[i % SLIDE_EFFECTS.length]
                });
            }

            await new Promise(resolve => setTimeout(resolve, 500));
        }

        setGeneratedImages(images);
        setProgress(50);
    };

    const createVoiceover = async (storyboardData, images) => {
        setCurrentTask('Generating voiceovers...');
        setCurrentStep(4);

        if (!storyboardData || !storyboardData.scenes || storyboardData.scenes.length === 0) {
            setError('Storyboard data is missing or empty.');
            return;
        }

        try {
            const voiceoverData = [];
            const scenes = storyboardData.scenes || [];
            const selectedVoiceModel = availableModels.tts.find(m => m.id === projectSettings.selected_voice_model);

            for (let i = 0; i < scenes.length; i++) {
                setCurrentTask(`Generating voiceover ${i + 1} of ${scenes.length}...`);
                setProgress(50 + (i / scenes.length) * 25);

                const scene = scenes[i];
                if (scene.dialogue && scene.dialogue.trim()) {
                    let audioBlob = null;
                    let audioUrl = null;
                    let sceneError = null;

                    try {
                        if (selectedVoiceModel && selectedVoiceModel.provider === 'google') {
                            try {
                                const voiceName = selectedVoiceModel.api_parameters?.voice_name || 'en-US-Neural2-C';
                                const languageCode = selectedVoiceModel.api_parameters?.language_code || language || 'en-US';

                                const response = await base44.functions.invoke('generateVoiceGoogle', {
                                    text: scene.dialogue,
                                    voice_name: voiceName,
                                    language_code: languageCode
                                });

                                let audioResp = response instanceof Blob ? response : response?.data;
                if (audioResp && !(audioResp instanceof Blob) && audioResp.audio_url) {
                    audioResp = await fetch(audioResp.audio_url).then(r => r.blob());
                }
                                if (audioResp instanceof Blob && audioResp.size > 0) {
                                    audioBlob = audioResp;
                                    audioUrl = URL.createObjectURL(audioBlob);
                                    console.log(`✓ Google TTS audio generated for scene ${i + 1}: ${audioBlob.size} bytes`);
                                } else {
                                    sceneError = 'Google TTS returned invalid audio';
                                    console.warn(`⚠ Google TTS returned empty/invalid audio for scene ${i + 1}`);
                                }
                            } catch (googleError) {
                                const msg = (googleError && (googleError.response?.data?.error?.message || googleError.message)) || 'Google TTS error';
                                sceneError = msg;
                                console.warn(`Google TTS error for scene ${i + 1}:`, msg);
                            }
                        } else if (selectedVoiceModel && selectedVoiceModel.provider === 'elevenlabs') {
                            try {
                                const response = await base44.functions.invoke('generateVoiceElevenLabs', {
                                    text: scene.dialogue,
                                    voice_id: selectedVoiceModel.api_parameters?.voice_id || 'default',
                                    model_id: selectedVoiceModel.model_name || 'eleven_multilingual_v2'
                                });

                                let audioResp = response instanceof Blob ? response : response?.data;
                if (audioResp && !(audioResp instanceof Blob) && audioResp.audio_url) {
                    audioResp = await fetch(audioResp.audio_url).then(r => r.blob());
                }
                                if (audioResp instanceof Blob && audioResp.size > 0) {
                                    audioBlob = audioResp;
                                    audioUrl = URL.createObjectURL(audioBlob);
                                    console.log(`✓ ElevenLabs audio generated for scene ${i + 1}: ${audioBlob.size} bytes`);
                                } else {
                                    sceneError = 'ElevenLabs returned invalid audio';
                                    console.warn(`⚠ ElevenLabs returned empty/invalid audio for scene ${i + 1}`);
                                }
                            } catch (elevenLabsError) {
                                const msg = (elevenLabsError && (elevenLabsError.response?.data?.error || elevenLabsError.message)) || 'ElevenLabs error';
                                sceneError = msg;
                                console.warn(`ElevenLabs error for scene ${i + 1}:`, msg);
                            }
                        } else {
                            console.warn(`⚠ No valid TTS provider for scene ${i + 1} - skipping audio generation`);
                        }

                        const words = scene.dialogue.split(' ').filter(w => w.length > 0);
                        const avgWordsPerSecond = 2.2;
                        let currentTime = 0;
                        const wordTimings = words.map((word) => {
                            const cleanWord = word.replace(/[^\w'-]/g, '');
                            const duration = cleanWord.length > 0 ? (1 / avgWordsPerSecond) : 0;
                            const startTime = currentTime;
                            const endTime = startTime + duration;
                            currentTime = endTime;
                            return {
                                word: cleanWord,
                                start_time: startTime,
                                end_time: endTime
                            };
                        }).filter(wt => wt.word.length > 0);

                        voiceoverData.push({
                            scene_number: scene.scene_number,
                            dialogue: scene.dialogue,
                            duration: scene.duration || 5,
                            estimated_duration: scene.duration || 5,
                            language: language,
                            wordTimings: wordTimings,
                            audioBlob: audioBlob,
                            audioUrl: audioUrl,
                            error: sceneError
                        });

                    } catch (error) {
                        console.error('Error during voiceover generation for scene:', i + 1, error);
                        const words = scene.dialogue.split(' ').filter(w => w.length > 0);
                        const avgWordsPerSecond = 2.2;
                        let currentTime = 0;
                        const wordTimings = words.map((word) => {
                            const cleanWord = word.replace(/[^\w'-]/g, '');
                            const duration = cleanWord.length > 0 ? (1 / avgWordsPerSecond) : 0;
                            const startTime = currentTime;
                            const endTime = startTime + duration;
                            currentTime = endTime;
                            return {
                                word: cleanWord,
                                start_time: startTime,
                                end_time: endTime
                            };
                        }).filter(wt => wt.word.length > 0);

                        voiceoverData.push({
                            scene_number: scene.scene_number,
                            dialogue: scene.dialogue,
                            duration: scene.duration || 5,
                            language: language,
                            wordTimings: wordTimings,
                            audioBlob: null,
                            audioUrl: null,
                            error: error?.message || 'Voiceover generation failed'
                        });
                    }
                } else {
                    voiceoverData.push({
                        scene_number: scene.scene_number,
                        dialogue: "",
                        duration: scene.duration || 5,
                        language: language,
                        wordTimings: [],
                        audioBlob: null,
                        audioUrl: null,
                        error: 'No dialogue provided'
                    });
                }

                await new Promise(resolve => setTimeout(resolve, 500));
            }

            setVoiceovers(voiceoverData);
            setAudioData(voiceoverData);
            setProgress(75);

        } catch (err) {
            console.error('Overall voiceover generation error:', err);
            setError('Failed to generate voiceovers. Please try again.');
        }
    };

    const generateSpeechAudio = async (text, languageCode, speed = 1.0, pitch = 1.0) => {
        return new Promise((resolve) => {
            if (!window.speechSynthesis) {
                console.warn('Speech synthesis not supported in this browser.');
                resolve(null);
                return;
            }

            const utterance = new SpeechSynthesisUtterance(text);

            utterance.lang = languageCode;
            utterance.rate = speed;
            utterance.pitch = pitch;
            utterance.volume = 1.0;

            const setVoice = () => {
                const voices = speechSynthesis.getVoices();
                const voice = voices.find(v => v.lang.startsWith(languageCode) && v.localService) ||
                    voices.find(v => v.lang.startsWith(languageCode));
                if (voice) {
                    utterance.voice = voice;
                }
            };

            if (speechSynthesis.getVoices().length === 0) {
                speechSynthesis.onvoiceschanged = () => {
                    setVoice();
                    speechSynthesis.onvoiceschanged = null;
                };
            } else {
                setVoice();
            }

            utterance.onend = () => {
                resolve(null);
            };

            utterance.onerror = (event) => {
                console.error('Speech error:', event);
                resolve(null);
            };

            speechSynthesis.speak(utterance);
        });
    };

    const applySlideEffect = (ctx, canvas, img, effect, progress) => {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        const imgAspect = img.width / img.height;
        const canvasAspect = canvas.width / canvas.height;

        let drawWidth, drawHeight, drawX, drawY;

        if (imgAspect > canvasAspect) {
            drawHeight = canvas.height;
            drawWidth = canvas.height * imgAspect;
            drawX = (canvas.width - drawWidth) / 2;
            drawY = 0;
        } else {
            drawWidth = canvas.width;
            drawHeight = canvas.width / imgAspect;
            drawX = 0;
            drawY = (canvas.height - drawHeight) / 2;
        }

        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let currentDrawWidth = drawWidth;
        let currentDrawHeight = drawHeight;
        let currentDrawX = drawX;
        let currentDrawY = drawY;

        switch (effect) {
            case 'zoom-in':
                const zoomInScale = 1.0 + (0.3 * progress);
                currentDrawWidth = drawWidth * zoomInScale;
                currentDrawHeight = drawHeight * zoomInScale;
                currentDrawX = centerX - (currentDrawWidth / 2);
                currentDrawY = centerY - (currentDrawHeight / 2);
                break;

            case 'zoom-out':
                const zoomOutScale = 1.3 - (0.3 * progress);
                currentDrawWidth = drawWidth * zoomOutScale;
                currentDrawHeight = drawHeight * zoomOutScale;
                currentDrawX = centerX - (currentDrawWidth / 2);
                currentDrawY = centerY - (currentDrawHeight / 2);
                break;

            case 'pan-left':
                currentDrawWidth = canvas.height * imgAspect * 1.2;
                currentDrawHeight = canvas.height * 1.2;
                currentDrawX = (canvas.width - currentDrawWidth) + ((currentDrawWidth - canvas.width) * progress);
                currentDrawY = (canvas.height - currentDrawHeight) / 2;
                break;

            case 'pan-right':
                currentDrawWidth = canvas.height * imgAspect * 1.2;
                currentDrawHeight = canvas.height * 1.2;
                currentDrawX = -(currentDrawWidth - canvas.width) * progress;
                currentDrawY = (canvas.height - currentDrawHeight) / 2;
                break;

            case 'fade-in':
                ctx.globalAlpha = progress;
                break;

            case 'fade-out':
                ctx.globalAlpha = 1 - progress;
                break;

            default:
                break;
        }

        try {
            ctx.drawImage(img, currentDrawX, currentDrawY, currentDrawWidth, currentDrawHeight);
        } catch (error) {
            console.error('Error drawing image:', error);
            ctx.fillStyle = '#333333';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.restore();
    };

    const wrapText = (ctx, text, maxWidth) => {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine + (currentLine.length > 0 ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && currentLine.length > 0) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine.length > 0) {
            lines.push(currentLine);
        }
        return lines;
    };

    const addSynchronizedCaption = (ctx, canvas, voiceData, currentTime) => {
        if (!voiceData || !voiceData.dialogue) return;

        const overlayHeight = 120;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, canvas.height - overlayHeight, canvas.width, overlayHeight);

        let currentWordIndex = -1;
        if (voiceData.wordTimings) {
            for (let i = 0; i < voiceData.wordTimings.length; i++) {
                if (currentTime >= voiceData.wordTimings[i].start_time && currentTime < voiceData.wordTimings[i].end_time) {
                    currentWordIndex = i;
                    break;
                }
            }
        }

        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const allText = voiceData.wordTimings ? voiceData.wordTimings.map(w => w.word).join(' ') : voiceData.dialogue;
        const maxWidth = canvas.width - 80;
        const lines = wrapText(ctx, allText, maxWidth);

        const lineHeight = 40;
        const startY = canvas.height - overlayHeight + (overlayHeight - (lines.length * lineHeight)) / 2;

        let globalWordCounter = 0;
        lines.forEach((line, lineIndex) => {
            const lineMetrics = ctx.measureText(line);
            let currentLineX = (canvas.width / 2) - (lineMetrics.width / 2);

            const lineWords = line.split(' ');
            for (let i = 0; i < lineWords.length; i++) {
                const wordInLine = lineWords[i];
                const originalWordObj = voiceData.wordTimings ? voiceData.wordTimings[globalWordCounter] : null;
                const isCurrentWord = globalWordCounter === currentWordIndex;

                const displayWord = originalWordObj ? originalWordObj.word : wordInLine;

                ctx.fillStyle = isCurrentWord ? '#FFFF00' : '#FFFFFF';
                ctx.fillText(displayWord, currentLineX + ctx.measureText(displayWord).width / 2, startY + lineIndex * lineHeight);

                currentLineX += ctx.measureText(displayWord + (i < lineWords.length - 1 ? ' ' : '')).width;
                globalWordCounter++;
            }
        });
    };

    const renderImageSceneWithEffects = async (ctx, canvas, img, imageData, duration, voiceData, fps = 30, sceneStartTime = 0) => {
        const totalFrames = Math.ceil(duration * fps);
        const frameDelay = 1000 / fps;

        for (let frame = 0; frame < totalFrames; frame++) {
            const progress = frame / Math.max(totalFrames - 1, 1);
            const sceneTime = progress * duration;
            const absoluteTime = sceneStartTime + sceneTime;

            applySlideEffect(ctx, canvas, img, imageData.effect || 'zoom-in', progress);

            if (voiceData && voiceData.dialogue) {
                addSynchronizedCaption(ctx, canvas, voiceData, sceneTime);
            }

            await new Promise(resolve => setTimeout(resolve, frameDelay));
        }
    };

    const renderPlaceholderScene = async (ctx, canvas, imageData, duration, voiceData, fps = 30, sceneStartTime = 0) => {
        const totalFrames = Math.ceil(duration * fps);
        const frameDelay = 1000 / fps;

        for (let frame = 0; frame < totalFrames; frame++) {
            const progress = frame / Math.max(totalFrames - 1, 1);
            const sceneTime = progress * duration;
            const absoluteTime = sceneStartTime + sceneTime;

            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#1a1a2e');
            gradient.addColorStop(1, '#16213e');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 60px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`Scene ${imageData.scene_number}`, canvas.width / 2, canvas.height / 2 - 80);

            ctx.font = '28px Arial';
            ctx.fillStyle = '#fbbf24';
            const desc = imageData.description || 'AI Generated Scene';
            const wrappedDesc = wrapText(ctx, desc, canvas.width - 200);
            wrappedDesc.forEach((line, index) => {
                ctx.fillText(line, canvas.width / 2, canvas.height / 2 + (index * 35));
            });

            if (voiceData && voiceData.dialogue) {
                addSynchronizedCaption(ctx, canvas, voiceData, sceneTime);
            }

            await new Promise(resolve => setTimeout(resolve, frameDelay));
        }
    };

    const assembleVideo = async (images, voiceoverData) => {
        setCurrentTask('Assembling final video...');
        setCurrentStep(5);
        setProgress(80);

        const mode = projectSettings.video_generation_mode;

        if (mode === 'fal_runway' || mode === 'fal_minimax') {
            await assembleVideoWithAI(images, voiceoverData, mode);
        } else if (mode === 'json2video') {
            await assembleVideoWithJson2Video(images, voiceoverData);
        } else {
            await assembleVideoWithCanvas(images, voiceoverData);
        }
    };

    const assembleVideoWithAI = async (images, voiceoverData, mode) => {
        setCurrentTask('Generating AI video with real motion...');

        try {
            const videoClips = [];

            for (let i = 0; i < images.length; i++) {
                const imageData = images[i];
                const voiceData = voiceoverData.find(v => v.scene_number === imageData.scene_number);

                setCurrentTask(`Generating AI video for scene ${i + 1} of ${images.length}...`);
                setProgress(75 + (i / images.length) * 20);

                if (!imageData.url) {
                    continue;
                }

                try {
                    const motionPrompt = `
                        ${imageData.description}. 
                        Smooth camera movement, cinematic motion, ${imageData.effect} effect.
                        Dynamic and engaging, professional cinematography.
                    `.trim();

                    const videoResponse = await base44.functions.invoke('generateVideoFal', {
                        prompt: motionPrompt,
                        image_url: imageData.url,
                        model: mode === 'fal_runway'
                            ? 'fal-ai/runway-gen3/turbo/image-to-video'
                            : 'fal-ai/minimax/video-01',
                        duration: imageData.duration || 5,
                        aspect_ratio: projectSettings.aspect_ratio
                    });

                    let _falUrl = videoResponse.data?.video_url;
                    if (!_falUrl && videoResponse.data?.job_id) _falUrl = await pollVideoJob(videoResponse.data.job_id);
                    if (_falUrl) {
                        videoClips.push({
                            url: _falUrl,
                            scene_number: imageData.scene_number,
                            duration: imageData.duration || 5,
                            voiceover: voiceData
                        });
                    }

                } catch (err) {
                    console.error(`Error generating video for scene ${i + 1}:`, err);
                    setError(`Failed to generate video for scene ${i + 1}. Continuing...`);
                }

                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            if (videoClips.length === 0) {
                throw new Error('No video clips were generated');
            }

            setGeneratedVideoBlob(null);
            setVideoUrl(videoClips[0].url);
            setProgress(100);
            setCurrentTask('AI Video generation complete!');
            saveVideoToProfile(null, 'fal_ai', videoClips[0].url);

        } catch (err) {
            console.error("AI video generation error:", err);
            setError(`Failed to generate AI video: ${err.message}`);
        }
    };

    const assembleVideoWithJson2Video = async (images, voiceoverData) => {
        setCurrentTask('Generating video with Json2video templates...');

        try {
            const scenes = images.map((img, idx) => ({
                image_url: img.url,
                dialogue: voiceoverData[idx]?.dialogue || '',
                duration: img.duration || 5
            }));

            const response = await base44.functions.invoke('generateVideoJson2video', {
                scenes,
                settings: projectSettings
            });

            let _j2vUrl = response.data?.video_url;
            if (!_j2vUrl && response.data?.job_id) _j2vUrl = await pollVideoJob(response.data.job_id);
            if (_j2vUrl) {
                setVideoUrl(_j2vUrl);
                setGeneratedVideoBlob(null);
                setProgress(100);
                setCurrentTask('Template video generation complete!');
                saveVideoToProfile(null, 'json2video', _j2vUrl);
            } else {
                throw new Error('Json2video failed to generate video');
            }

        } catch (err) {
            console.error("Json2video error:", err);
            setError(`Failed to generate template video: ${err.message}`);
        }
    };

    const assembleVideoWithCanvas = async (images, voiceoverData) => {
        setCurrentTask('Creating video with canvas...');

        try {
            if (!images || images.length === 0) {
                throw new Error("No scenes available to create video");
            }

            if (!window.MediaRecorder) {
                throw new Error("MediaRecorder API is not supported in your browser. Please use Chrome or Edge.");
            }

            const dimensions = getCanvasDimensions(projectSettings.aspect_ratio, projectSettings.resolution);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = dimensions.width;
            canvas.height = dimensions.height;

            const mimeTypes = [
                'video/webm;codecs=vp9,opus',
                'video/webm;codecs=vp8,opus',
                'video/webm;codecs=vp9',
                'video/webm;codecs=vp8',
                'video/webm'
            ];

            let selectedMimeType = '';
            for (const mimeType of mimeTypes) {
                if (MediaRecorder.isTypeSupported(mimeType)) {
                    selectedMimeType = mimeType;
                    break;
                }
            }

            if (!selectedMimeType) {
                throw new Error("No supported video format found. Please use Chrome or Edge browser.");
            }

            const fps = 30;
            const canvasStream = canvas.captureStream(fps);

            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const audioDestination = audioContext.createMediaStreamDestination();

            let currentAudioTime = 0;
            const audioBuffers = [];

            console.log('=== AUDIO ASSEMBLY DEBUG ===');
            console.log('Processing voiceovers for audio:', voiceoverData.length);
            console.log('Selected voice model:', projectSettings.selected_voice_model);

            for (let i = 0; i < voiceoverData.length; i++) {
                const voiceover = voiceoverData[i];
                console.log(`Scene ${i + 1} voiceover:`, {
                    hasAudioBlob: !!voiceover.audioBlob,
                    hasAudioUrl: !!voiceover.audioUrl,
                    dialogue: voiceover.dialogue,
                    audioBlobSize: voiceover.audioBlob?.size || 0
                });

                if (voiceover.audioBlob) {
                    try {
                        const arrayBuffer = await voiceover.audioBlob.arrayBuffer();
                        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                        audioBuffers.push({
                            buffer: audioBuffer,
                            startTime: currentAudioTime,
                            duration: images[i]?.duration || 5
                        });
                        console.log(`✓ Added audio for scene ${i + 1}`);
                    } catch (err) {
                        console.error(`Failed to decode audio for scene ${i + 1}:`, err);
                    }
                } else {
                    console.warn(`⚠ No audio blob for scene ${i + 1}`);
                }
                currentAudioTime += (images[i]?.duration || 5);
            }

            console.log(`Total audio buffers prepared: ${audioBuffers.length}`);

            let combinedStream;
            if (audioBuffers.length > 0) {
                const audioTrack = audioDestination.stream.getAudioTracks()[0];
                console.log('✓ Audio track created:', audioTrack);
                combinedStream = new MediaStream([
                    ...canvasStream.getVideoTracks(),
                    audioTrack
                ]);
                console.log('✓ Combined stream with audio created');
            } else {
                console.warn('⚠ No audio buffers - creating video-only stream');
                combinedStream = canvasStream;
            }

            const mediaRecorder = new MediaRecorder(combinedStream, {
                mimeType: selectedMimeType,
                videoBitsPerSecond: projectSettings.resolution === '1080p' ? 5000000 : 2500000,
                audioBitsPerSecond: audioBuffers.length > 0 ? 128000 : undefined
            });

            const chunks = [];
            let dataReceived = false;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    chunks.push(event.data);
                    dataReceived = true;
                }
            };

            mediaRecorder.onstop = () => {
                if (chunks.length > 0 && dataReceived) {
                    const videoBlob = new Blob(chunks, { type: selectedMimeType });

                    if (videoBlob.size > 0) {
                        setGeneratedVideoBlob(videoBlob);
                        const videoUrl = URL.createObjectURL(videoBlob);
                        setVideoUrl(videoUrl);
                        setProgress(100);
                        setCurrentTask('Video generation complete!');

                        audioContext.close();
                        saveVideoToProfile(videoBlob, 'canvas');
                    } else {
                        setError('Generated video is empty.');
                    }
                } else {
                    setError('Failed to record video data.');
                }
            };

            mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event.error);
                setError(`Recording failed: ${event.error?.message}`);
            };

            mediaRecorder.start(100);

            if (audioBuffers.length > 0) {
                console.log('Starting audio playback...');
                audioBuffers.forEach(({ buffer, startTime }, index) => {
                    const source = audioContext.createBufferSource();
                    source.buffer = buffer;
                    source.connect(audioDestination);
                    const actualStartTime = audioContext.currentTime + startTime + 0.1;
                    source.start(actualStartTime);
                    console.log(`Audio ${index + 1} scheduled at ${startTime}s (context time: ${actualStartTime})`);
                });
                console.log('✓ All audio sources scheduled');
            } else {
                console.warn('⚠ Skipping audio playback - no audio buffers available');
            }

            for (let i = 0; i < images.length; i++) {
                const imageData = images[i];
                const voiceData = voiceoverData.find(v => v.scene_number === imageData.scene_number);
                const sceneDuration = imageData.duration || 5;

                setCurrentTask(`Rendering scene ${i + 1} of ${images.length}...`);
                setProgress(75 + (i / images.length) * 20);

                if (imageData.url) {
                    await new Promise((resolve, reject) => {
                        const img = new Image();
                        img.crossOrigin = 'anonymous';

                        const timeout = setTimeout(() => {
                            renderPlaceholderScene(ctx, canvas, imageData, sceneDuration, voiceData, fps, sceneStartTime).then(resolve).catch(reject);
                        }, 15000);

                        img.onload = async () => {
                            clearTimeout(timeout);
                            try {
                                await renderImageSceneWithEffects(ctx, canvas, img, imageData, sceneDuration, voiceData, fps, 0);
                                resolve();
                            } catch (error) {
                                console.error(`Error rendering scene ${i + 1}:`, error);
                                reject(error);
                            }
                        };

                        img.onerror = async (error) => {
                            clearTimeout(timeout);
                            await renderPlaceholderScene(ctx, canvas, imageData, sceneDuration, voiceData, fps, 0);
                            resolve();
                        };

                        img.src = imageData.url;
                    });
                } else {
                    await renderPlaceholderScene(ctx, canvas, imageData, sceneDuration, voiceData, fps, 0);
                }
            }

            await new Promise(resolve => setTimeout(resolve, 1000));

            if (mediaRecorder.state === 'recording') {
                mediaRecorder.requestData();
                await new Promise(resolve => setTimeout(resolve, 500));
                mediaRecorder.stop();
            }

        } catch (err) {
            console.error("Canvas video assembly error:", err);
            setError(`Failed to create video: ${err.message}`);
        }
    };

    const handleDownloadVideo = async () => {
        try {
            if (generatedVideoBlob) {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(generatedVideoBlob);
                link.download = `video-${Date.now()}.webm`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            } else if (videoUrl) {
                const link = document.createElement('a');
                link.href = videoUrl;
                link.download = `video-${Date.now()}.${videoUrl.split('.').pop().split('?')[0] || 'mp4'}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                setError('No video available to download.');
            }
        } catch (error) {
            setError('Download failed. Please try again.');
            console.error('Download error:', error);
        }
    };

    const handleDownload = handleDownloadVideo;

    const handleDownloadImage = async (imageUrl, sceneNumber) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `scene-${sceneNumber}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            setError('Failed to download image. Please try again.');
        }
    };

    const closeVideoPreview = () => {
        setIsVideoPlaying(false);
    };

    const resetApp = () => {
        setScript('');
        setLanguage('en');
        setCurrentStep(1);
        setWorkflowStep(1);
        setStepStatuses({ 1: 'current', 2: 'pending', 3: 'pending', 4: 'pending', 5: 'pending' });
        setIsProcessing(false);
        setProgress(0);
        setCurrentTask('');
        setStoryboard(null);
        setGeneratedImages([]);
        setAudioData([]);
        setVoiceovers([]);
        setGeneratedVideoBlob(null);
        setError('');
        setVideoUrl('');
        setIsVideoPlaying(false);
        setShowSettings(false);
        setReferenceImageUrl(null);
        setRegeneratingSceneIndex(null);
        setProjectName('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setProjectSettings(prev => ({
            ...prev,
            selected_llm_model: null,
            selected_image_model: null,
            selected_voice_model: null,
            selected_video_model: null,
            video_generation_mode: 'canvas'
        }));
        setHasSelectedStoryboardModel(false);
        setHasSelectedImageModel(false);
        setHasSelectedVoiceModel(false);
        setHasSelectedVideoModel(false);
        loadAvailableModels(userTier);
    };

    const handleProjectLoad = (project) => {
        setCurrentProject(project);
        setScript(project.script || '');
        setLanguage(project.language || 'en');
        setProjectName(project.title || '');
        setReferenceImageUrl(project.reference_image || null);
        setStoryboard(project.storyboard || null);
        setGeneratedImages(project.images || []);
        setVoiceovers(project.voiceovers || []);
        setVideoUrl(project.video_url || '');
        setProjectSettings(project.settings || projectSettings);

        if (project.video_url) {
            setWorkflowStep(5);
            setCurrentStep(5);
            setStepStatuses({
                1: 'completed', 2: 'completed', 3: 'completed', 4: 'completed', 5: 'current'
            });
        } else if (project.voiceovers && project.voiceovers.length > 0) {
            setWorkflowStep(4);
            setCurrentStep(4);
            setStepStatuses({
                1: 'completed', 2: 'completed', 3: 'completed', 4: 'current', 5: 'pending'
            });
        } else if (project.images && project.images.length > 0) {
            setWorkflowStep(2);
            setCurrentStep(3);
            setStepStatuses({
                1: 'completed', 2: 'current', 3: 'pending', 4: 'pending', 5: 'pending'
            });
        } else if (project.storyboard) {
            setWorkflowStep(1);
            setCurrentStep(2);
            setStepStatuses({
                1: 'current', 2: 'pending', 3: 'pending', 4: 'pending', 5: 'pending'
            });
        } else {
            setWorkflowStep(1);
            setCurrentStep(1);
            setStepStatuses({
                1: 'current', 2: 'pending', 3: 'pending', 4: 'pending', 5: 'pending'
            });
        }
    };

    const handleProjectSave = (project) => {
        setCurrentProject(project);
    };

    const loadSelectedMusic = useCallback(async () => {
        if (!projectSettings.background_music) {
            setSelectedMusicTrack(null);
            return;
        }

        try {
            const tracks = await base44.entities.MusicTrack.filter({ id: projectSettings.background_music });
            if (tracks.length > 0) {
                setSelectedMusicTrack(tracks[0]);
            }
        } catch (err) {
            console.error('Error loading music track:', err);
        }
    }, [projectSettings.background_music]);

    useEffect(() => {
        loadUserSettings();
        checkBrowserCompatibility();
        recoverStateFromLocalStorage();
    }, []);

    const saveStateToLocalStorage = useCallback(() => {
        try {
            const stateToSave = {
                script,
                language,
                projectName,
                storyboard,
                generatedImages,
                voiceovers,
                projectSettings,
                workflowStep,
                stepStatuses,
                videoUrl,
                referenceImageUrl
            };
            localStorage.setItem('videoWorkflowState', JSON.stringify(stateToSave));
        } catch (err) {
            console.warn('Failed to save state to localStorage:', err);
        }
    }, [script, language, projectName, storyboard, generatedImages, voiceovers, projectSettings, workflowStep, stepStatuses, videoUrl, referenceImageUrl]);

    const recoverStateFromLocalStorage = useCallback(() => {
        try {
            const savedState = localStorage.getItem('videoWorkflowState');
            if (savedState) {
                const state = JSON.parse(savedState);
                setScript(state.script || '');
                setLanguage(state.language || 'en');
                setProjectName(state.projectName || '');
                setStoryboard(state.storyboard || null);
                setGeneratedImages(state.generatedImages || []);
                setVoiceovers(state.voiceovers || []);
                setProjectSettings(state.projectSettings || {});
                setWorkflowStep(state.workflowStep || 1);
                setStepStatuses(state.stepStatuses || {});
                setVideoUrl(state.videoUrl || '');
                setReferenceImageUrl(state.referenceImageUrl || null);
                console.log('Recovered workflow state from localStorage');
            }
        } catch (err) {
            console.warn('Failed to recover state from localStorage:', err);
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(saveStateToLocalStorage, 5000);
        return () => clearInterval(interval);
    }, [saveStateToLocalStorage]);

    const loadAvailableModels = async (tierName) => {
        try {
            console.log('Loading models for tier:', tierName);

            const allModels = await base44.entities.AIModelConfig.list();
            console.log('Total models fetched:', allModels.length);

            const llmModels = allModels.filter(m =>
                m.is_active &&
                m.model_type === 'llm' &&
                m.tier_access &&
                Array.isArray(m.tier_access) &&
                m.tier_access.includes(tierName)
            );

            const imageModels = allModels.filter(m =>
                m.is_active &&
                m.model_type === 'image' &&
                m.tier_access &&
                Array.isArray(m.tier_access) &&
                m.tier_access.includes(tierName)
            );

            const ttsModels = allModels.filter(m =>
                m.is_active &&
                m.model_type === 'tts' &&
                m.tier_access &&
                Array.isArray(m.tier_access) &&
                m.tier_access.includes(tierName)
            );

            const videoModels = allModels.filter(m =>
                m.is_active &&
                m.model_type === 'video' &&
                m.tier_access &&
                Array.isArray(m.tier_access) &&
                m.tier_access.includes(tierName)
            );

            console.log('Filtered models:', {
                llm: llmModels.length,
                image: imageModels.length,
                tts: ttsModels.length,
                video: videoModels.length
            });

            setAvailableModels({
                llm: llmModels,
                image: imageModels,
                tts: ttsModels,
                video: videoModels
            });

            setProjectSettings(prev => {
                const updatedSettings = { ...prev };

                if (!prev.selected_llm_model || !llmModels.some(m => m.id === prev.selected_llm_model)) {
                    const defaultLLM = llmModels.find(m =>
                        m.is_default_for_tier &&
                        m.is_default_for_tier[tierName] === true
                    ) || llmModels[0];

                    if (defaultLLM) {
                        console.log('Setting default LLM model:', defaultLLM.model_name);
                        updatedSettings.selected_llm_model = defaultLLM.id;
                    }
                }

                if (!prev.selected_image_model || !imageModels.some(m => m.id === prev.selected_image_model)) {
                    const defaultImage = imageModels.find(m =>
                        m.is_default_for_tier &&
                        m.is_default_for_tier[tierName] === true
                    ) || imageModels[0];

                    if (defaultImage) {
                        updatedSettings.selected_image_model = defaultImage.id;
                    }
                }

                if (!prev.selected_voice_model || !ttsModels.some(m => m.id === prev.selected_voice_model)) {
                    const defaultTTS = ttsModels.find(m =>
                        m.is_default_for_tier &&
                        m.is_default_for_tier[tierName] === true
                    ) || ttsModels.find(m => m.provider === 'elevenlabs')
                        || ttsModels.find(m => m.provider === 'google')
                        || ttsModels.find(m => m.provider !== 'browser')
                        || ttsModels[0];

                    if (defaultTTS) {
                        updatedSettings.selected_voice_model = defaultTTS.id;
                    }
                }

                if (!prev.selected_video_model || !videoModels.some(m => m.id === prev.selected_video_model)) {
                    const defaultVideo = videoModels.find(m =>
                        m.is_default_for_tier &&
                        m.is_default_for_tier[tierName] === true
                    ) || videoModels[0];

                    if (defaultVideo) {
                        updatedSettings.selected_video_model = defaultVideo.id;
                    }
                }

                console.log('Updated settings:', {
                    llm: updatedSettings.selected_llm_model,
                    image: updatedSettings.selected_image_model,
                    voice: updatedSettings.selected_voice_model,
                    video: updatedSettings.selected_video_model
                });

                return updatedSettings;
            });

        } catch (err) {
            console.error('Error loading available models:', err);
            setError('Failed to load AI models. Please refresh the page.');
        }
    };

    const loadUserSettings = async () => {
        setIsLoadingSettings(true);
        try {
            let user;
            try {
                user = await base44.auth.me();
            } catch (e) {
                user = { email: 'guest@example.com', plan_type: 'free' };
            }

            setUserTier(user.plan_type || 'free');

            await loadAvailableModels(user.plan_type || 'free');

            let settings = await base44.entities.UserSettings.filter({ created_by: user.email });
            let userSetting;

            if (settings.length > 0) {
                userSetting = settings[0];
            } else {
                let initialDailyLimit = 10;
                if (user.plan_type === 'pro') {
                    initialDailyLimit = 50;
                } else if (user.plan_type === 'enterprise') {
                    initialDailyLimit = 999;
                }

                userSetting = await base44.entities.UserSettings.create({
                    created_by: user.email,
                    has_seen_tutorial: false,
                    daily_generations_count: 0,
                    daily_limit: initialDailyLimit,
                    voice_provider: 'browser',
                    last_generation_date: new Date().toISOString().split('T')[0]
                });
            }

            setUserSettings(userSetting);
            setShowTutorial(!userSetting.has_seen_tutorial);

            const today = new Date().toISOString().split('T')[0];
            const lastDate = userSetting.last_generation_date;

            let currentPlanLimit = 10;
            if (user.plan_type === 'pro') {
                currentPlanLimit = 50;
            } else if (user.plan_type === 'enterprise') {
                currentPlanLimit = 999;
            }

            if (lastDate !== today) {
                const updatedSettings = await base44.entities.UserSettings.update(userSetting.id, {
                    daily_generations_count: 0,
                    last_generation_date: today,
                    daily_limit: currentPlanLimit
                });
                setDailyUsage({ ...dailyUsage, current: 0, limit: updatedSettings.daily_limit || 10 });
                setUserSettings(updatedSettings);
            } else {
                setDailyUsage({
                    current: userSetting.daily_generations_count || 0,
                    limit: currentPlanLimit
                });
                if (userSetting.daily_limit !== currentPlanLimit) {
                    const updatedSettings = await base44.entities.UserSettings.update(userSetting.id, {
                        daily_limit: currentPlanLimit
                    });
                    setUserSettings(updatedSettings);
                }
            }
        } catch (err) {
            console.error('Error loading user settings:', err);
            setUserSettings({
                id: 'guest',
                created_by: 'guest@example.com',
                has_seen_tutorial: false,
                daily_generations_count: 0,
                daily_limit: 3,
                voice_provider: 'browser',
                last_generation_date: new Date().toISOString().split('T')[0]
            });
            setShowTutorial(true);
            setDailyUsage({ current: 0, limit: 3 });
            setUserTier('free');
            setError('Failed to load user settings. Functionality may be limited.');
            loadAvailableModels('free');
        } finally {
            setIsLoadingSettings(false);
        }
    };

    useEffect(() => {
        if (projectSettings.background_music) {
            loadSelectedMusic();
        }
    }, [loadSelectedMusic, projectSettings.background_music]);

    const handleCloseTutorial = async () => {
        if (userSettings && userSettings.id !== 'guest') {
            try {
                await base44.entities.UserSettings.update(userSettings.id, { has_seen_tutorial: true });
                setUserSettings({ ...userSettings, has_seen_tutorial: true });
            } catch (err) {
                console.error('Failed to update tutorial status:', err);
            }
        }
        setShowTutorial(false);
    };

    const checkBrowserCompatibility = () => {
        const supportsSpeechSynthesis = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
        const supportsMediaRecorder = 'MediaRecorder' in window;

        if (!supportsSpeechSynthesis || !supportsMediaRecorder) {
            setIsBrowserCompatible(false);
        } else {
            setIsBrowserCompatible(true);
        }
    };

    const canProceedStep1 = () => {
        if (!storyboard) {
            return script.trim().length > 0 && language && projectSettings.selected_llm_model;
        }
        return storyboard && storyboard.scenes.length > 0 && projectSettings.selected_image_model;
    };

    const onProceedStep1 = () => {
        if (!storyboard) {
            generateStoryboard();
        } else {
            handleProceedToImages();
        }
    };

    const canProceedStep2 = () => {
        return generatedImages.length > 0 && projectSettings.selected_voice_model;
    };

    const canProceedStep3 = () => {
        return voiceovers.length > 0;
    };

    const canProceedStep4 = () => {
        return projectSettings.selected_video_model && projectName.trim().length > 0;
    };

    const handleSaveProject = async () => {
        if (!projectName.trim()) {
            setError('Please enter a project name');
            return;
        }

        try {
            const projectData = {
                title: projectName,
                script,
                language,
                reference_image: referenceImageUrl,
                storyboard,
                images: generatedImages,
                voiceovers,
                video_url: videoUrl,
                settings: projectSettings,
                status: videoUrl ? 'completed' : 'processing'
            };

            if (currentProject && currentProject.id) {
                const updated = await base44.entities.Project.update(currentProject.id, projectData);
                setCurrentProject(updated);
            } else {
                const created = await base44.entities.Project.create(projectData);
                setCurrentProject(created);
            }

            setSuccess('Project saved successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error saving project:', err);
            setError('Failed to save project. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100">
            {showTutorial && userSettings && !userSettings.has_seen_tutorial && (
                <WelcomeTutorial onClose={handleCloseTutorial} />
            )}
            {!isBrowserCompatible && <BrowserCompatibilityNotice />}

            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40" />

            <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="flex items-center justify-center mb-6">
                        <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-2xl">
                            <Film className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-5xl font-bold text-slate-900 mb-4 leading-tight">
                        Cuts & Flow
                        <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent"> Generator</span>
                    </h1>
                    <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                        Transform your scripts into professional videos with AI-generated visuals and voiceovers
                    </p>
                </motion.div>

                {!isLoadingSettings && dailyUsage.current > 0 && (
                    <div className="mb-6">
                        <RateLimitNotice current={dailyUsage.current} limit={dailyUsage.limit} />
                    </div>
                )}

                <div className="mb-12">
                    <div className="flex items-center justify-between max-w-4xl mx-auto">
                        {steps.map((step, index) => (
                            <div key={step.number} className="flex items-center">
                                <div className={`
                                    relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-500
                                    ${currentStep >= step.number
                                        ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-amber-400 text-white shadow-lg'
                                        : 'border-gray-300 text-gray-500 bg-white'
                                    }
                                `}>
                                    <step.icon className="w-5 h-5" />
                                </div>
                                <div className="ml-3 hidden lg:block">
                                    <p className={`text-sm font-medium ${currentStep >= step.number ? 'text-amber-500' : 'text-gray-500'
                                        }`}>
                                        {step.title}
                                    </p>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`
                                        hidden sm:block w-8 h-0.5 ml-4 transition-all duration-500
                                        ${currentStep > step.number ? 'bg-amber-400' : 'bg-gray-300'}
                                    `} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <WorkflowStepControl
                            stepNumber={1}
                            title="Generate Storyboard"
                            icon={FileText}
                            description={storyboard ? "Review and edit your AI-generated storyboard, then select image model before proceeding." : "AI analyzes your script and creates a scene-by-scene breakdown with optional reference image for visual consistency."}
                            status={stepStatuses[1]}
                            onProceed={onProceedStep1}
                            isProcessing={isProcessing && workflowStep === 1}
                            canProceed={canProceedStep1() && checkRateLimit()}
                            color="purple"
                            processingButtonText={!storyboard ? 'Analyzing Script...' : 'Generating Images...'}
                            proceedButtonText={!storyboard ? 'Generate Storyboard' : 'Proceed to Image Generation'}
                        >
                            <div className="space-y-6">
                                {availableModels.llm.length > 0 && (
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <ModelSelector
                                            models={availableModels.llm}
                                            selectedModelId={projectSettings.selected_llm_model}
                                            onSelect={(modelId) => {
                                                setProjectSettings({ ...projectSettings, selected_llm_model: modelId });
                                                setHasSelectedStoryboardModel(true);
                                            }}
                                            label="AI Model (Storyboard Generation)"
                                            disabled={isProcessing}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Higher quality models produce better storyboards
                                        </p>
                                    </div>
                                )}
                                {!projectSettings.selected_llm_model && (
                                    <Alert className="mt-3 border-amber-500 bg-amber-50">
                                        <AlertCircle className="h-4 w-4 text-amber-600" />
                                        <AlertDescription className="text-amber-800 text-sm">
                                            Please select an AI model for storyboard generation.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="block text-sm font-medium text-slate-600">
                                            Your Script
                                        </label>
                                        <SpeechToText
                                            onTranscript={handleSpeechTranscript}
                                            isDisabled={isProcessing}
                                        />
                                    </div>
                                    <Textarea
                                        placeholder="Type or speak your script here..."
                                        value={script}
                                        onChange={(e) => setScript(e.target.value)}
                                        className="min-h-[200px] bg-white/50 border-gray-300"
                                        disabled={isProcessing}
                                    />
                                    <div className="flex items-center justify-between mt-3">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isProcessing}
                                        >
                                            Upload Text File
                                        </Button>
                                        <span className="text-xs text-gray-500">
                                            {script.length} characters
                                        </span>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".txt"
                                        onChange={handleScriptUpload}
                                        className="hidden"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-3">
                                        Select Language
                                    </label>
                                    <Select value={language} onValueChange={setLanguage} disabled={isProcessing}>
                                        <SelectTrigger className="bg-white/50">
                                            <SelectValue placeholder="Choose language..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SUPPORTED_LANGUAGES.map((lang) => (
                                                <SelectItem key={lang.code} value={lang.code}>
                                                    <div className="flex items-center gap-2">
                                                        <span>{lang.flag}</span>
                                                        <span>{lang.name}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <label className="block text-sm font-medium text-slate-600 mb-2">
                                        Reference Image (Optional)
                                    </label>
                                    <p className="text-xs text-gray-500 mb-3">
                                        Upload a reference image for character/style consistency across all generated scenes
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => document.getElementById('reference-image-input').click()}
                                            disabled={isUploadingReference || isProcessing}
                                            className="flex items-center gap-2"
                                        >
                                            <Upload className="w-4 h-4" />
                                            {referenceImageUrl ? 'Change Reference' : 'Upload Reference'}
                                        </Button>
                                        {isUploadingReference && (
                                            <div className="w-5 h-5 border-2 border-amber-400 border-t-amber-600 rounded-full animate-spin" />
                                        )}
                                        {referenceImageUrl && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setReferenceImageUrl(null)}
                                                className="text-red-600"
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                    <input
                                        id="reference-image-input"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleReferenceImageUpload}
                                        className="hidden"
                                    />
                                    {referenceImageUrl && (
                                        <div className="mt-3">
                                            <img
                                                src={referenceImageUrl}
                                                alt="Reference"
                                                className="w-full h-32 object-cover rounded border-2 border-amber-300"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {storyboard && (
                                <>
                                    <StoryboardEditor
                                        storyboard={storyboard}
                                        onUpdate={handleStoryboardUpdate}
                                        onGenerate={() => { }}
                                    />

                                    {availableModels.image.length > 0 && (
                                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                                            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                                <ImageIcon className="w-5 h-5" />
                                                Select Image Generation Model
                                            </h4>
                                            <p className="text-sm text-blue-700 mb-3">
                                                Choose which AI model to use for generating visuals before proceeding to the next step.
                                            </p>
                                            <ModelSelector
                                                models={availableModels.image}
                                                selectedModelId={projectSettings.selected_image_model}
                                                onSelect={(modelId) => {
                                                    setProjectSettings({ ...projectSettings, selected_image_model: modelId });
                                                    setHasSelectedImageModel(true);
                                                }}
                                                label="Image Model"
                                                disabled={isProcessing}
                                            />
                                            {!projectSettings.selected_image_model && (
                                                <Alert className="mt-3 border-amber-500 bg-amber-50">
                                                    <AlertCircle className="h-4 w-4 text-amber-600" />
                                                    <AlertDescription className="text-amber-800 text-sm">
                                                        Please select an image generation model to proceed to the next step.
                                                    </AlertDescription>
                                                </Alert>
                                            )}

                                            <div className="mt-4 pt-4 border-t border-blue-200">
                                                <label className="block text-sm font-medium text-blue-900 mb-2">
                                                    Reference Image (Optional)
                                                </label>
                                                <p className="text-xs text-blue-700 mb-3">
                                                    Upload a reference image for style consistency, character likeness, and visual coherence across all scenes
                                                </p>

                                                <div className="mb-3">
                                                    <label className="text-xs font-medium text-blue-800 block mb-2">
                                                        Reference Strength: <span className="font-bold">{Math.round(projectSettings.reference_strength * 100)}%</span>
                                                    </label>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="1"
                                                        step="0.05"
                                                        value={projectSettings.reference_strength}
                                                        onChange={(e) => setProjectSettings({ ...projectSettings, reference_strength: parseFloat(e.target.value) })}
                                                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                                                    />
                                                    <div className="flex justify-between text-xs text-blue-600 mt-1">
                                                        <span>Light (0%)</span>
                                                        <span>Maximum (100%)</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => document.getElementById('reference-image-input').click()}
                                                        disabled={isUploadingReference || isProcessing}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Upload className="w-4 h-4" />
                                                        {referenceImageUrl ? 'Change Reference' : 'Upload Reference'}
                                                    </Button>
                                                    {isUploadingReference && (
                                                        <div className="w-5 h-5 border-2 border-blue-400 border-t-blue-600 rounded-full animate-spin" />
                                                    )}
                                                    {referenceImageUrl && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setReferenceImageUrl(null)}
                                                            className="text-red-600"
                                                        >
                                                            Remove
                                                        </Button>
                                                    )}
                                                </div>
                                                <input
                                                    id="reference-image-input"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleReferenceImageUpload}
                                                    className="hidden"
                                                />
                                                {referenceImageUrl && (
                                                    <div className="mt-3">
                                                        <img
                                                            src={referenceImageUrl}
                                                            alt="Reference"
                                                            className="w-full h-32 object-cover rounded border-2 border-blue-300"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </WorkflowStepControl>

                        <WorkflowStepControl
                            stepNumber={2}
                            title="Generate Images"
                            icon={ImageIcon}
                            description="Review generated images, then select voice model before proceeding to voiceover generation."
                            status={stepStatuses[2]}
                            onProceed={handleProceedToVoiceovers}
                            isProcessing={isProcessing && workflowStep === 2}
                            canProceed={canProceedStep2()}
                            color="blue"
                            processingButtonText="Generating Images..."
                            proceedButtonText="Proceed to Voiceover Generation"
                        >
                            {generatedImages.length > 0 && (
                                <>
                                    <div className="mb-4">
                                        <Button
                                            onClick={async () => {
                                                setIsProcessing(true);
                                                await generateImages(storyboard);
                                                setIsProcessing(false);
                                            }}
                                            disabled={isProcessing || !storyboard}
                                            variant="outline"
                                            className="w-full border-blue-300 hover:bg-blue-50"
                                        >
                                            <Wand2 className="w-4 h-4 mr-2" />
                                            Regenerate All Images
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                                        {generatedImages.map((image, index) => (
                                            <div key={index} className="relative group aspect-video bg-gray-200 rounded-lg overflow-hidden">
                                                {image.url ? (
                                                    <>
                                                        <img
                                                            src={image.url}
                                                            alt={`Scene ${image.scene_number}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute top-2 left-2">
                                                            <Badge className="bg-black/70 text-white">
                                                                Scene {image.scene_number}
                                                            </Badge>
                                                        </div>
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                onClick={() => regenerateScene(index)}
                                                                disabled={regeneratingSceneIndex !== null || isProcessing}
                                                                className="gap-2"
                                                            >
                                                                {regeneratingSceneIndex === index ? (
                                                                    <>
                                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                        Regenerating...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Wand2 className="w-4 h-4" />
                                                                        Regenerate
                                                                    </>
                                                                )}
                                                            </Button>
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                onClick={() => handleDownloadImage(image.url, image.scene_number)}
                                                                className="gap-2"
                                                            >
                                                                <Download className="w-4 h-4 mr-2" />
                                                                Download
                                                            </Button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <div className="w-6 h-6 border-2 border-blue-400 border-t-blue-600 rounded-full animate-spin" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {availableModels.tts.length > 0 && (
                                        <div className="mt-6 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                                            <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                                                <Mic className="w-5 h-5" />
                                                Select Voice/TTS Model
                                            </h4>
                                            <p className="text-sm text-green-700 mb-3">
                                                Choose which voice model to use for generating voiceovers before proceeding.
                                            </p>
                                            <ModelSelector
                                                models={availableModels.tts}
                                                selectedModelId={projectSettings.selected_voice_model}
                                                onSelect={(modelId) => {
                                                    setProjectSettings({ ...projectSettings, selected_voice_model: modelId });
                                                    setHasSelectedVoiceModel(true);
                                                }}
                                                label="Voice Model"
                                                disabled={isProcessing}
                                            />
                                            {!projectSettings.selected_voice_model && (
                                                <Alert className="mt-3 border-amber-500 bg-amber-50">
                                                    <AlertCircle className="h-4 w-4 text-amber-600" />
                                                    <AlertDescription className="text-amber-800 text-sm">
                                                        Please select a voice model to proceed to voiceover generation.
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </WorkflowStepControl>

                        <WorkflowStepControl
                            stepNumber={3}
                            title="Generate Voiceovers"
                            icon={Mic}
                            description="Review voice settings and generated voiceovers, then proceed to add music and effects."
                            status={stepStatuses[3]}
                            onProceed={handleProceedToMusic}
                            isProcessing={isProcessing && workflowStep === 3}
                            canProceed={canProceedStep3()}
                            color="green"
                            processingButtonText="Generating Voiceovers..."
                            proceedButtonText="Proceed to Music & Effects"
                        >
                            <div className="mb-4">
                                <Button
                                    onClick={async () => {
                                        setIsProcessing(true);
                                        await createVoiceover(storyboard, generatedImages);
                                        setIsProcessing(false);
                                    }}
                                    disabled={isProcessing || !storyboard || !projectSettings.selected_voice_model}
                                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                                >
                                    <Wand2 className="w-4 h-4 mr-2" />
                                    {voiceovers.length > 0 ? 'Regenerate All Voiceovers' : 'Generate Voiceovers'}
                                </Button>
                            </div>

                            {projectSettings.selected_voice_model && (() => {
                                const selectedModel = availableModels.tts.find(m => m.id === projectSettings.selected_voice_model);
                                if (selectedModel?.provider === 'browser') {
                                    return (
                                        <Alert className="mb-4 border-amber-500 bg-amber-50">
                                            <AlertCircle className="h-4 w-4 text-amber-600" />
                                            <AlertDescription className="text-amber-800 text-sm">
                                                ⚠️ Browser TTS cannot generate audio files for videos. Please select Google TTS or ElevenLabs below for voiceover generation.
                                            </AlertDescription>
                                        </Alert>
                                    );
                                }
                            })()}

                            <VoiceSettings
                                settings={projectSettings}
                                onUpdate={setProjectSettings}
                                availableTTSModels={availableModels.tts}
                                userTier={userTier}
                            />
                            {voiceovers.length > 0 && (
                                <>
                                    {(() => {
                                        const withDialogue = voiceovers.filter(v => v.dialogue && v.dialogue.trim().length > 0).length;
                                        const withAudio = voiceovers.filter(v => v.audioUrl || v.audioBlob).length;
                                        if (withAudio > 0 && withAudio === withDialogue) {
                                            return (
                                                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                                                    <p className="text-sm text-green-800 font-medium">✓ {withAudio}/{withDialogue} voiceovers generated successfully</p>
                                                    <p className="text-xs text-green-600 mt-1">Review the settings above. Click the regenerate button on any voiceover to edit or re-generate it.</p>
                                                </div>
                                            );
                                        }
                                        return (
                                            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                                <p className="text-sm text-amber-800 font-medium">{withAudio}/{withDialogue} voiceovers generated</p>
                                                <p className="text-xs text-amber-700 mt-1">Some scenes failed to generate audio. Check the error shown on each scene and click Regenerate.</p>
                                            </div>
                                        );
                                    })()}
                                    <div className="mt-4 space-y-3">
                                        <h4 className="text-sm font-semibold text-slate-700">Generated Voiceovers</h4>
                                        {voiceovers.map((vo, index) => (
                                            <div key={index} className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-green-300 transition-colors">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Badge variant="outline" className="font-medium">Scene {vo.scene_number}</Badge>
                                                        {vo.audioUrl || vo.audioBlob ? (
                                                            <Badge className="bg-green-100 text-green-700 border-green-300">
                                                                ✓ Audio Ready
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-red-100 text-red-700 border-red-300">
                                                                ⚠ No Audio
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                console.log('🔘 Regenerate button clicked for scene', index);
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                regenerateVoiceover(index);
                                                            }}
                                                            disabled={regeneratingVoiceIndex !== null}
                                                            className="flex-shrink-0 hover:bg-green-50 hover:border-green-500 min-w-[110px]"
                                                        >
                                                            {regeneratingVoiceIndex === index ? (
                                                                <>
                                                                    <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin mr-2" />
                                                                    <span className="text-xs">Regenerating...</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Wand2 className="w-4 h-4 mr-2" />
                                                                    <span className="text-xs font-medium">Regenerate</span>
                                                                </>
                                                            )}
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                console.log('🧪 Test (new key) clicked for scene', index);
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                regenerateVoiceover(index, true);
                                                            }}
                                                            disabled={regeneratingVoiceIndex !== null}
                                                            className="flex-shrink-0 hover:bg-amber-50 hover:border-amber-500 min-w-[130px]"
                                                        >
                                                            <Wand2 className="w-4 h-4 mr-2" />
                                                            <span className="text-xs font-medium">Test (new key)</span>
                                                        </Button>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{vo.dialogue}</p>
                                                {vo.audioUrl ? (
                                                    <audio controls className="w-full" src={vo.audioUrl} />
                                                ) : (
                                                    <div className="p-3 bg-red-50 rounded border border-red-200">
                                                        <p className="text-sm text-red-700 font-medium">⚠️ No audio generated. Click "Regenerate" above to try again.</p>
                                                        {vo.error && (
                                                            <p className="text-xs text-red-600 mt-1 truncate" title={vo.error}>Error: {vo.error}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </WorkflowStepControl>

                        <WorkflowStepControl
                            stepNumber={4}
                            title="Add Music & Effects"
                            icon={Music}
                            description="Select background music (optional) and configure volume before generating the final video."
                            status={stepStatuses[4]}
                            onProceed={handleProceedToFinalVideo}
                            isProcessing={isProcessing && workflowStep === 4}
                            canProceed={canProceedStep4()}
                            color="amber"
                            processingButtonText="Generating Final Video..."
                            proceedButtonText="Generate Final Video"
                        >
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Project Name
                                    </label>
                                    <Input
                                        placeholder="Enter project name..."
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                        className="bg-white"
                                        disabled={isProcessing}
                                    />
                                </div>

                                {availableModels.video.length > 0 && (
                                    <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                                        <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                                            <Video className="w-5 h-5" />
                                            Select Video Generation Model
                                        </h4>
                                        <p className="text-sm text-purple-700 mb-3">
                                            Choose which video model to use for final video assembly
                                        </p>
                                        <ModelSelector
                                            models={availableModels.video}
                                            selectedModelId={projectSettings.selected_video_model}
                                            onSelect={(modelId) => {
                                                setProjectSettings({ ...projectSettings, selected_video_model: modelId });
                                                setHasSelectedVideoModel(true);
                                            }}
                                            label="Video Model"
                                            disabled={isProcessing}
                                        />
                                        {!projectSettings.selected_video_model && (
                                            <Alert className="mt-3 border-amber-500 bg-amber-50">
                                                <AlertCircle className="h-4 w-4 text-amber-600" />
                                                <AlertDescription className="text-amber-800 text-sm">
                                                    Please select a video generation model
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </div>
                                )}

                                <MusicSelector
                                    selectedTrackId={projectSettings.background_music}
                                    musicVolume={projectSettings.music_volume}
                                    onSelect={(trackId) => setProjectSettings({ ...projectSettings, background_music: trackId })}
                                    onVolumeChange={(volume) => setProjectSettings({ ...projectSettings, music_volume: volume })}
                                />

                                {!projectName.trim() && (
                                    <Alert className="border-amber-500 bg-amber-50">
                                        <AlertCircle className="h-4 w-4 text-amber-600" />
                                        <AlertDescription className="text-amber-800 text-sm">
                                            Please enter a project name before generating the video
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        </WorkflowStepControl>

                        <WorkflowStepControl
                            stepNumber={5}
                            title="Final Video"
                            icon={Video}
                            description="Your video is being assembled. This may take a few moments."
                            status={stepStatuses[5]}
                            isProcessing={isProcessing && workflowStep === 5}
                            canProceed={false}
                            color="red"
                            processingButtonText="Finalizing Video..."
                        >
                            {videoUrl && (
                                <div className="space-y-4">
                                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                        <video
                                            controls
                                            className="w-full h-full"
                                            src={videoUrl}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleDownload}
                                            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download
                                        </Button>
                                        <Button
                                            onClick={handleSaveProject}
                                            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500"
                                        >
                                            Save Project
                                        </Button>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setIsProcessing(true);
                                                assembleVideo(generatedImages, voiceovers).finally(() => setIsProcessing(false));
                                            }}
                                            disabled={isProcessing}
                                            className="flex-1"
                                        >
                                            <Wand2 className="w-4 h-4 mr-2" />
                                            Regenerate Video
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={resetApp}
                                            className="flex-1"
                                        >
                                            Create Another Video
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </WorkflowStepControl>

                        {error && (
                            <Alert className="border-red-500 bg-red-500/10">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <AlertDescription className="text-red-600">{error}</AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <div className="space-y-6">
                        <AnimatePresence>
                            {(isProcessing) && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                >
                                    <Card className="bg-white/60 backdrop-blur-sm shadow-2xl">
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-lg font-semibold text-slate-800">Processing</h3>
                                                    <Badge className="bg-amber-100 text-amber-700">
                                                        {Math.round(progress)}%
                                                    </Badge>
                                                </div>
                                                <Progress value={progress} className="h-2" />
                                                <p className="text-sm text-slate-600">{currentTask}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <VideoGenerationModeSelector
                            selectedMode={projectSettings.video_generation_mode}
                            onSelect={(mode) => setProjectSettings({ ...projectSettings, video_generation_mode: mode })}
                            userTier={userTier}
                        />

                        <Card className="bg-white/60 backdrop-blur-sm shadow-xl">
                            <CardHeader>
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowSettings(!showSettings)}
                                    className="w-full justify-between"
                                >
                                    <span className="flex items-center gap-2">
                                        <SettingsIcon className="w-5 h-5 text-amber-500" />
                                        Advanced Settings
                                    </span>
                                    <ChevronRight className={`w-4 h-4 transition-transform ${showSettings ? 'rotate-90' : ''}`} />
                                </Button>
                            </CardHeader>
                        </Card>

                        <AnimatePresence>
                            {showSettings && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-6"
                                >
                                    <ExportSettings
                                        settings={projectSettings}
                                        onUpdate={setProjectSettings}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <SavedVideosManager key={savedVideosKey} />

                        <Card className="bg-white/60 backdrop-blur-sm shadow-xl">
                            <CardHeader>
                                <h3 className="text-lg font-semibold text-slate-800">My Projects</h3>
                            </CardHeader>
                            <CardContent>
                                <ProjectManager
                                    currentProject={{
                                        ...currentProject,
                                        title: projectName,
                                        script,
                                        language,
                                        reference_image: referenceImageUrl,
                                        storyboard,
                                        images: generatedImages,
                                        voiceovers,
                                        video_url: videoUrl,
                                        settings: projectSettings
                                    }}
                                    onLoad={handleProjectLoad}
                                    onSave={handleProjectSave}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <FAQChatbot />
        </div>
    );
}