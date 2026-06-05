
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Film, FileText, Wand2, Music, Video, ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { UserSettings } from '@/entities/UserSettings';
import { User } from '@/entities/User';

const TUTORIAL_STEPS = [
    {
        title: "Welcome to Cuts & Flow! 🎬",
        description: "Transform your scripts into professional videos with AI-generated visuals and voiceovers in minutes.",
        icon: Film,
        image: null
    },
    {
        title: "Two Ways to Create Videos",
        description: "Choose Script Mode to generate everything from text, or Image Mode to use your own images with custom dialogues.",
        icon: FileText,
        features: [
            "📝 Script Mode: AI generates storyboard & images",
            "🖼️ Image Mode: Upload your own images",
            "🎤 Multi-language voiceovers (15+ languages)",
            "🎵 Add background music"
        ]
    },
    {
        title: "AI-Powered Workflow",
        description: "Our AI analyzes your script and creates a complete storyboard with scene descriptions, dialogues, and visual details.",
        icon: Wand2,
        features: [
            "🎯 Scene breakdown & timing",
            "🎨 AI-generated images",
            "🗣️ Synchronized voiceovers",
            "✨ Professional effects"
        ]
    },
    {
        title: "Customize Everything",
        description: "Edit storyboards, adjust timings, change effects, and fine-tune every aspect of your video before generation.",
        icon: Video,
        features: [
            "✏️ Edit scenes & dialogues",
            "⏱️ Adjust durations",
            "🎬 Choose slide effects",
            "🎛️ Voice & music settings"
        ]
    },
    {
        title: "Browser Requirements",
        description: "For the best experience, we recommend using Chrome or Edge. Safari and Firefox may have limited audio/video support.",
        icon: Music,
        features: [
            "✅ Chrome/Edge (Recommended)",
            "⚠️ Firefox (Limited support)",
            "⚠️ Safari (May have issues)",
            "📱 Mobile: Use Chrome for Android"
        ]
    }
];

export default function WelcomeTutorial() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        checkTutorialStatus();
    }, []);

    const checkTutorialStatus = async () => {
        try {
            const user = await User.me();
            const userSettings = await UserSettings.filter({ created_by: user.email });

            if (userSettings.length === 0) {
                // First time user - create settings and show tutorial
                const newSettings = await UserSettings.create({
                    has_seen_tutorial: false,
                    daily_generations_count: 0,
                    daily_limit: 10,
                    voice_provider: 'browser',
                    last_generation_date: new Date().toISOString().split('T')[0]
                });
                setSettings(newSettings);
                setIsOpen(true);
            } else if (!userSettings[0].has_seen_tutorial) {
                setSettings(userSettings[0]);
                setIsOpen(true);
            }
        } catch (err) {
            // User not logged in or error - don't show tutorial
            console.log('Cannot show tutorial:', err);
        }
    };

    const handleComplete = async () => {
        if (settings && settings.id) {
            try {
                await UserSettings.update(settings.id, { has_seen_tutorial: true });
            } catch (err) {
                console.error('Failed to update tutorial status:', err);
            }
        }
        setIsOpen(false);
    };

    const handleNext = () => {
        if (currentStep < TUTORIAL_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        handleComplete();
    };

    if (!isOpen) return null;

    const step = TUTORIAL_STEPS[currentStep];
    const StepIcon = step.icon;
    const progressPercent = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleSkip()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-2xl font-bold">
                            Getting Started
                        </DialogTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSkip}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            Skip Tutorial
                        </Button>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Step {currentStep + 1} of {TUTORIAL_STEPS.length}</span>
                            <span>{Math.round(progressPercent)}%</span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                    </div>

                    {/* Step Content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4"
                        >
                            {/* Icon */}
                            <div className="flex justify-center">
                                <div className="p-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl">
                                    <StepIcon className="w-12 h-12 text-white" />
                                </div>
                            </div>

                            {/* Title & Description */}
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-bold text-gray-900">
                                    {step.title}
                                </h3>
                                <p className="text-gray-600">
                                    {step.description}
                                </p>
                            </div>

                            {/* Features List */}
                            {step.features && (
                                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                    {step.features.map((feature, index) => (
                                        <div
                                            key={index}
                                            className="flex items-start gap-3 text-sm text-gray-700"
                                        >
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={handlePrev}
                            disabled={currentStep === 0}
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Previous
                        </Button>

                        <Button
                            onClick={handleNext}
                            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                        >
                            {currentStep === TUTORIAL_STEPS.length - 1 ? (
                                <>
                                    Get Started
                                    <Film className="w-4 h-4 ml-2" />
                                </>
                            ) : (
                                <>
                                    Next
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
