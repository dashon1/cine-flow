import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Radio } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function SpeechToText({ onTranscript, isDisabled }) {
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState(null);
    const [interimTranscript, setInterimTranscript] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // Check if browser supports speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            setError('Speech recognition not supported in this browser');
            return;
        }

        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onresult = (event) => {
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += transcript + ' ';
                } else {
                    interim += transcript;
                }
            }

            if (final) {
                onTranscript(final);
                setInterimTranscript('');
            } else {
                setInterimTranscript(interim);
            }
        };

        recognitionInstance.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'no-speech') {
                setError('No speech detected. Please try again.');
            } else if (event.error === 'not-allowed') {
                setError('Microphone access denied');
            } else {
                setError('Speech recognition error');
            }
            setIsListening(false);
        };

        recognitionInstance.onend = () => {
            setIsListening(false);
            setInterimTranscript('');
        };

        setRecognition(recognitionInstance);

        return () => {
            if (recognitionInstance) {
                recognitionInstance.stop();
            }
        };
    }, [onTranscript]);

    const toggleListening = () => {
        if (!recognition) return;

        if (isListening) {
            recognition.stop();
            setIsListening(false);
            setInterimTranscript('');
        } else {
            setError('');
            try {
                recognition.start();
                setIsListening(true);
            } catch (err) {
                console.error('Error starting recognition:', err);
                setError('Failed to start recording');
            }
        }
    };

    if (error && !isListening) {
        return (
            <div className="text-center">
                <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="border-red-300 text-red-600"
                >
                    <MicOff className="w-4 h-4 mr-2" />
                    {error}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-3">
                <Button
                    onClick={toggleListening}
                    disabled={isDisabled}
                    variant={isListening ? "destructive" : "outline"}
                    size="sm"
                    className={`
                        relative transition-all duration-300
                        ${isListening 
                            ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/50' 
                            : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                        }
                    `}
                >
                    <motion.div
                        animate={isListening ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                        {isListening ? (
                            <Radio className="w-4 h-4 mr-2" />
                        ) : (
                            <Mic className="w-4 h-4 mr-2" />
                        )}
                    </motion.div>
                    {isListening ? 'Stop Recording' : 'Voice Input'}
                </Button>

                <AnimatePresence>
                    {isListening && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                        >
                            <Badge className="bg-red-500 text-white animate-pulse">
                                Listening...
                            </Badge>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {interimTranscript && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-2 bg-blue-50 border border-blue-200 rounded-lg"
                    >
                        <p className="text-sm text-blue-700 italic">
                            "{interimTranscript}"
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}