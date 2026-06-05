import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    HelpCircle, 
    FileText, 
    Image as ImageIcon, 
    Music, 
    Video, 
    Settings as SettingsIcon,
    Zap,
    Chrome,
    AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";

const FAQ_ITEMS = [
    {
        category: "Getting Started",
        icon: HelpCircle,
        questions: [
            {
                q: "How do I create a video?",
                a: "Choose between Script Mode (AI generates everything) or Image Mode (use your own images). Select a language, then click Generate. The AI will create a storyboard, images, and voiceovers automatically."
            },
            {
                q: "What languages are supported?",
                a: "We support 15+ languages including English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese, Hindi, Tamil, Arabic, Turkish, and Dutch."
            },
            {
                q: "How long does it take to create a video?",
                a: "Typically 2-5 minutes depending on the number of scenes and complexity. Script analysis takes ~30 seconds, image generation ~1 minute per scene, and video assembly ~1 minute."
            }
        ]
    },
    {
        category: "Script Mode",
        icon: FileText,
        questions: [
            {
                q: "What makes a good script?",
                a: "Keep it concise (300-500 words for best results). Write clear, speakable dialogue. Include visual details. Aim for 6-8 scenes maximum for optimal video length."
            },
            {
                q: "Can I edit the storyboard?",
                a: "Yes! After AI generates the storyboard, you can edit scene descriptions, dialogues, durations, camera angles, and moods before generating images."
            },
            {
                q: "Can I use voice input?",
                a: "Yes! Click the microphone button to speak your script. Works best in Chrome with a good microphone."
            }
        ]
    },
    {
        category: "Image Mode",
        icon: ImageIcon,
        questions: [
            {
                q: "What image formats are supported?",
                a: "JPG, PNG, GIF, and WebP. Maximum file size depends on your browser, but we recommend keeping images under 5MB each."
            },
            {
                q: "Can I reorder my images?",
                a: "Yes! Drag and drop images to reorder them. Scene numbers will update automatically."
            },
            {
                q: "What slide effects are available?",
                a: "Zoom In, Zoom Out, Pan Left, Pan Right, Fade In, and Fade Out. Each image can have a different effect."
            }
        ]
    },
    {
        category: "Background Music",
        icon: Music,
        questions: [
            {
                q: "How do I add background music?",
                a: "Go to Advanced Settings (gear icon), select a track from the Music Library, and adjust the volume. Music will loop for the full video duration."
            },
            {
                q: "Can I upload my own music?",
                a: "Yes! Go to the Music Library page and click 'Add New Track'. You can upload audio files or provide direct URLs to audio files."
            },
            {
                q: "What audio formats work?",
                a: "MP3, WAV, OGG, and M4A. Make sure to use direct links to audio files (not YouTube or streaming services)."
            }
        ]
    },
    {
        category: "Voice & Audio",
        icon: SettingsIcon,
        questions: [
            {
                q: "Why does the voiceover sound robotic?",
                a: "Currently using browser text-to-speech which varies by browser. We're planning to add ElevenLabs integration for professional, human-like voices. Chrome/Edge have the best voice quality."
            },
            {
                q: "Can I adjust voice settings?",
                a: "Yes! In Advanced Settings you can adjust voice speed (0.5x-2.0x) and pitch (0.5x-2.0x)."
            },
            {
                q: "Can I add my own voiceover?",
                a: "Currently, voiceovers are generated automatically from your dialogues. Custom audio upload is planned for a future update."
            }
        ]
    },
    {
        category: "Export & Quality",
        icon: Video,
        questions: [
            {
                q: "What video format do I get?",
                a: "Videos are exported as WebM (VP8 codec), which works in all modern browsers. MP4 export is planned for a future update."
            },
            {
                q: "What resolutions are available?",
                a: "720p (HD) and 1080p (Full HD). You can also choose aspect ratios: 16:9 (YouTube), 9:16 (TikTok/Stories), 1:1 (Instagram), or 4:3 (Classic)."
            },
            {
                q: "Can I save my project?",
                a: "Yes! Name your project and click Save. You can reload it anytime from the 'My Projects' section."
            }
        ]
    },
    {
        category: "Usage Limits",
        icon: Zap,
        questions: [
            {
                q: "How many videos can I create?",
                a: "Free users can create 10 videos per day. The limit resets every 24 hours at midnight."
            },
            {
                q: "What counts as one video?",
                a: "Each completed video generation (when you click 'Create Video' and it finishes processing) counts toward your daily limit."
            },
            {
                q: "Can I increase my limit?",
                a: "Premium plans with higher limits are coming soon! Check back for updates."
            }
        ]
    },
    {
        category: "Browser & Technical",
        icon: Chrome,
        questions: [
            {
                q: "Which browsers are supported?",
                a: "Best: Chrome and Microsoft Edge (Chromium). Limited support: Firefox and Safari. Mobile: Chrome for Android works well, Safari iOS has limitations."
            },
            {
                q: "Why isn't it working on Safari?",
                a: "Safari has limited support for Web Audio API and MediaRecorder. Some features like voiceover generation may not work properly. We recommend Chrome or Edge."
            },
            {
                q: "The video won't play. What should I do?",
                a: "Make sure you're using Chrome or Edge. Clear your browser cache. Check that your browser is up to date. If issues persist, try a different browser."
            }
        ]
    },
    {
        category: "Troubleshooting",
        icon: AlertCircle,
        questions: [
            {
                q: "My images didn't generate properly",
                a: "This can happen occasionally with AI. Try regenerating, or use Image Mode to upload your own images instead."
            },
            {
                q: "Audio isn't playing",
                a: "Check browser permissions for audio. Some browsers block autoplay. Try clicking play manually. Make sure audio URLs are direct links to audio files."
            },
            {
                q: "Video generation failed",
                a: "Try reducing the number of scenes (6-8 is optimal). Make sure all images loaded properly. If using music, verify the audio file is accessible. Refresh the page and try again."
            }
        ]
    }
];

export default function Help() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 p-6">
            <div className="container mx-auto max-w-5xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">
                        <HelpCircle className="inline-block w-10 h-10 mr-3 text-blue-500" />
                        Help & FAQ
                    </h1>
                    <p className="text-lg text-slate-600">
                        Everything you need to know about creating AI-powered videos
                    </p>
                </motion.div>

                {/* FAQ Categories */}
                <div className="space-y-6">
                    {FAQ_ITEMS.map((category, categoryIndex) => {
                        const CategoryIcon = category.icon;
                        return (
                            <motion.div
                                key={categoryIndex}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: categoryIndex * 0.1 }}
                            >
                                <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-3 text-xl">
                                            <CategoryIcon className="w-6 h-6 text-blue-500" />
                                            {category.category}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {category.questions.map((item, qIndex) => (
                                            <div
                                                key={qIndex}
                                                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                                <h3 className="font-semibold text-gray-900 mb-2 flex items-start gap-2">
                                                    <Badge variant="outline" className="mt-0.5">Q</Badge>
                                                    {item.q}
                                                </h3>
                                                <p className="text-gray-700 text-sm leading-relaxed pl-8">
                                                    {item.a}
                                                </p>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Still Need Help */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-12"
                >
                    <Card className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                        <CardContent className="p-8 text-center">
                            <h2 className="text-2xl font-bold mb-2">Still Need Help?</h2>
                            <p className="text-blue-100 mb-4">
                                Can't find what you're looking for? We're here to help!
                            </p>
                            <p className="text-sm text-blue-100">
                                Contact support through the feedback button in the sidebar or email us directly.
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}