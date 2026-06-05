import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import {
    MessageCircle, X, Send, HelpCircle, Sparkles,
    FileText, Image as ImageIcon, Settings as SettingsIcon, Bot
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FAQ_CATEGORIES = [
    {
        title: 'Getting Started',
        icon: Sparkles,
        questions: [
            {
                q: 'How do I create my first video?',
                a: 'Choose between Script Mode (AI generates everything from text) or Image Mode (upload your own images). Select a language, then click Generate. The AI will create storyboard, images, and voiceovers automatically.'
            },
            {
                q: 'What languages are supported?',
                a: 'We support 15+ languages including English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese, Hindi, Tamil, Arabic, Turkish, and Dutch.'
            },
            {
                q: 'How long does it take?',
                a: 'Typically 2-5 minutes. Script analysis ~30 seconds, image generation ~1 minute per scene, video assembly ~1 minute. Total time depends on number of scenes.'
            }
        ]
    },
    {
        title: 'Script Mode',
        icon: FileText,
        questions: [
            {
                q: 'What makes a good script?',
                a: 'Write 300-500 words with clear, speakable dialogue. Include visual details and describe actions/movements (not just static scenes). Aim for 6-8 scenes for optimal video length.'
            },
            {
                q: 'Can I edit the storyboard?',
                a: 'Yes! After AI generates it, you can edit scene descriptions, dialogues, durations, camera angles, and moods before generating images.'
            },
            {
                q: 'Can I use voice input?',
                a: 'Yes! Click the microphone button to speak your script. Works best in Chrome with a good microphone.'
            }
        ]
    },
    {
        title: 'Image Mode',
        icon: ImageIcon,
        questions: [
            {
                q: 'What image formats work?',
                a: 'JPG, PNG, GIF, and WebP. Keep images under 5MB each for best performance.'
            },
            {
                q: 'Can I reorder images?',
                a: 'Yes! Drag and drop images to reorder. Scene numbers update automatically.'
            },
            {
                q: 'What slide effects are available?',
                a: 'Zoom In, Zoom Out, Pan Left, Pan Right, Fade In, and Fade Out. Each image can have a different effect.'
            }
        ]
    },
    {
        title: 'Advanced Features',
        icon: SettingsIcon,
        questions: [
            {
                q: 'How do I add background music?',
                a: 'Go to Advanced Settings (gear icon), select a track from Music Library, adjust volume. Music will loop for full video duration.'
            },
            {
                q: 'Can I upload my own music?',
                a: 'Yes! Go to Music Library page and click "Add New Track". Upload audio files or provide direct URLs to audio files.'
            },
            {
                q: 'What are the video quality options?',
                a: '720p (HD) and 1080p (Full HD). Choose aspect ratios: 16:9 (YouTube), 9:16 (TikTok/Stories), 1:1 (Instagram), or 4:3 (Classic).'
            }
        ]
    },
    {
        title: 'AI Models & Quality',
        icon: Bot,
        questions: [
            {
                q: 'Which AI models are available?',
                a: 'Free tier: GPT-4o-mini, Gemini 2.0 Flash. Pro tier: Claude 4.5 Sonnet, DALL-E 3, Flux.1. Enterprise: GPT-5, Gemini 2.5 Pro, Midjourney v7, Runway Gen-4.'
            },
            {
                q: 'How do I get better quality videos?',
                a: 'Upgrade to Pro/Enterprise for premium AI models. Use detailed scripts with action-oriented descriptions. Select high-quality image models. Choose 1080p resolution and professional voice models.'
            },
            {
                q: 'What is the daily limit?',
                a: 'Free: 10 videos/day. Pro: 50 videos/day. Enterprise: 999 videos/day. Limits reset at midnight.'
            }
        ]
    }
];

export default function FAQChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            type: 'bot',
            text: "👋 Hi! I'm your AI assistant. Ask me anything about creating videos, or choose a topic below.",
            timestamp: new Date()
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showCategories, setShowCategories] = useState(true);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const addMessage = (type, text) => {
        setMessages(prev => [...prev, { type, text, timestamp: new Date() }]);
    };

    const handleQuestionClick = (question, answer) => {
        addMessage('user', question);
        setShowCategories(false);

        setTimeout(() => {
            setIsTyping(true);
            setTimeout(() => {
                setIsTyping(false);
                addMessage('bot', answer);
            }, 1000);
        }, 300);
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;

        const userMessage = inputMessage;
        setInputMessage('');
        addMessage('user', userMessage);
        setShowCategories(false);
        setIsTyping(true);

        try {
            // Use AI to answer the question with context about the app
            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `You are a helpful assistant for "Cuts & Flow", a video creation app. 
                
                The app allows users to:
                - Create videos from scripts (Script Mode) or uploaded images (Image Mode)
                - Generate AI storyboards, images, and voiceovers
                - Add background music and effects
                - Export in multiple formats and aspect ratios
                - Use various AI models (GPT-5, Claude 4.5, Gemini 2.5, DALL-E 3, Midjourney v7, etc.)
                - Daily limits: Free (10), Pro (50), Enterprise (999) videos
                
                User question: "${userMessage}"
                
                Provide a helpful, concise answer (2-3 sentences max). Be friendly and encouraging.`,
                add_context_from_internet: false
            });

            setIsTyping(false);
            addMessage('bot', response || "I'm here to help! Could you rephrase your question?");
        } catch (error) {
            console.error('Chatbot error:', error);
            setIsTyping(false);
            addMessage('bot', "I'm having trouble right now. Try asking about: getting started, script tips, image mode, music, or video quality.");
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <>
            {/* Floating Chat Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="fixed bottom-6 right-6 z-50"
                    >
                        <Button
                            onClick={() => setIsOpen(true)}
                            className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-2xl"
                        >
                            <MessageCircle className="w-8 h-8 text-white" />
                        </Button>
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-6 right-6 z-50 w-[400px] h-[600px] flex flex-col"
                    >
                        <Card className="flex flex-col h-full bg-white shadow-2xl border-gray-200">
                            {/* Header */}
                            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                            <Bot className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">AI Assistant</CardTitle>
                                            <p className="text-xs text-blue-100">Always here to help</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsOpen(false)}
                                        className="text-white hover:bg-white/20"
                                    >
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>
                            </CardHeader>

                            {/* Messages */}
                            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map((message, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[80%] rounded-2xl px-4 py-2 ${message.type === 'user'
                                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                                        </div>
                                    </motion.div>
                                ))}

                                {isTyping && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex justify-start"
                                    >
                                        <div className="bg-gray-100 rounded-2xl px-4 py-3">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* FAQ Categories */}
                                {showCategories && messages.length === 1 && (
                                    <div className="space-y-3 mt-4">
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Quick Topics</p>
                                        {FAQ_CATEGORIES.map((category, catIndex) => {
                                            const Icon = category.icon;
                                            return (
                                                <div key={catIndex} className="space-y-2">
                                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                        <Icon className="w-4 h-4 text-blue-500" />
                                                        {category.title}
                                                    </div>
                                                    <div className="space-y-1">
                                                        {category.questions.slice(0, 2).map((qa, qaIndex) => (
                                                            <button
                                                                key={qaIndex}
                                                                onClick={() => handleQuestionClick(qa.q, qa.a)}
                                                                className="w-full text-left text-xs bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors text-gray-700"
                                                            >
                                                                {qa.q}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </CardContent>

                            {/* Input */}
                            <div className="p-4 border-t border-gray-200">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Ask me anything..."
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={!inputMessage.trim()}
                                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowCategories(!showCategories)}
                                        className="text-xs text-gray-500 hover:text-gray-700"
                                    >
                                        <HelpCircle className="w-3 h-3 mr-1" />
                                        {showCategories ? 'Hide' : 'Show'} Quick Topics
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}