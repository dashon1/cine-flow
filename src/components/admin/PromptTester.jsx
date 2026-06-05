import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InvokeLLM } from "@/integrations/Core";
import { Play, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PromptTester({ promptTemplate, variables }) {
    const [testInputs, setTestInputs] = useState({});
    const [isTesting, setIsTesting] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleTest = async () => {
        setIsTesting(true);
        setError('');
        setResult(null);

        try {
            // Replace variables in prompt
            let filledPrompt = promptTemplate;
            for (const [key, value] of Object.entries(testInputs)) {
                filledPrompt = filledPrompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
            }

            const response = await InvokeLLM({ prompt: filledPrompt });
            setResult(response);
        } catch (err) {
            setError('Test failed: ' + (err.message || 'Unknown error'));
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <Card className="bg-white/80 backdrop-blur-sm border-gray-200">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Play className="w-5 h-5 text-green-500" />
                    Test Prompt
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                        Fill in test values for each variable:
                    </p>
                    {variables?.map((variable) => {
                        const cleanVar = variable.replace(/[{}]/g, '');
                        return (
                            <div key={variable}>
                                <label className="text-xs text-gray-600 mb-1 block">
                                    <Badge variant="outline" className="mr-2">{variable}</Badge>
                                    Test Value
                                </label>
                                {cleanVar === 'script' || cleanVar === 'dialogue' || cleanVar === 'visual_description' ? (
                                    <Textarea
                                        placeholder={`Enter test ${cleanVar}...`}
                                        value={testInputs[cleanVar] || ''}
                                        onChange={(e) => setTestInputs({ ...testInputs, [cleanVar]: e.target.value })}
                                        className="h-20 text-sm"
                                    />
                                ) : (
                                    <Input
                                        placeholder={`Enter test ${cleanVar}...`}
                                        value={testInputs[cleanVar] || ''}
                                        onChange={(e) => setTestInputs({ ...testInputs, [cleanVar]: e.target.value })}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                <Button
                    onClick={handleTest}
                    disabled={isTesting || !variables?.every(v => testInputs[v.replace(/[{}]/g, '')])}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                    {isTesting ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                            Testing...
                        </>
                    ) : (
                        <>
                            <Play className="w-4 h-4 mr-2" />
                            Run Test
                        </>
                    )}
                </Button>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <Alert className="border-red-500 bg-red-50">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <AlertDescription className="text-red-700 text-sm">
                                    {error}
                                </AlertDescription>
                            </Alert>
                        </motion.div>
                    )}
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <Alert className="border-green-500 bg-green-50">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <AlertDescription className="text-green-700 text-sm">
                                    <strong>Test Result:</strong>
                                    <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-64">
                                        {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                                    </pre>
                                </AlertDescription>
                            </Alert>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}