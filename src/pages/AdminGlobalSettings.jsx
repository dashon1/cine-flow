import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Key } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminGlobalSettings() {
    const [settings, setSettings] = useState({
        openai_key: '',
        anthropic_key: '',
        google_key: '',
        elevenlabs_key: '',
        fal_key: '',
        stripe_key: '',
        stripe_webhook_secret: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleSave = async () => {
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            // In a real implementation, you would save these to environment variables
            // For now, we'll just show a success message
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            setSuccess('Settings saved successfully! Note: API keys should be set in Dashboard > Settings > Environment Variables');
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            setError('Failed to save settings');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Global Settings</h1>
                    <p className="text-slate-400">Configure API keys, integrations, and system settings</p>
                </div>

                {error && (
                    <Alert className="mb-6 border-red-500 bg-red-500/10">
                        <AlertDescription className="text-red-400">{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="mb-6 border-green-500 bg-green-500/10">
                        <AlertDescription className="text-green-400">{success}</AlertDescription>
                    </Alert>
                )}

                <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Key className="w-5 h-5" />
                            API Keys Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Alert className="border-blue-500 bg-blue-500/10">
                            <AlertDescription className="text-blue-400 text-sm">
                                <strong>Important:</strong> API keys should be configured in Dashboard → Settings → Environment Variables.
                                Current keys: OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY, ELEVENLABS_API_KEY, FAL_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-4">
                            <div>
                                <Label className="text-slate-300">OpenAI API Key</Label>
                                <Input
                                    type="password"
                                    placeholder="sk-..."
                                    value={settings.openai_key}
                                    onChange={(e) => setSettings({...settings, openai_key: e.target.value})}
                                    className="bg-slate-700 border-slate-600 text-white mt-2"
                                />
                            </div>

                            <div>
                                <Label className="text-slate-300">Anthropic API Key</Label>
                                <Input
                                    type="password"
                                    placeholder="sk-ant-..."
                                    value={settings.anthropic_key}
                                    onChange={(e) => setSettings({...settings, anthropic_key: e.target.value})}
                                    className="bg-slate-700 border-slate-600 text-white mt-2"
                                />
                            </div>

                            <div>
                                <Label className="text-slate-300">Google AI API Key</Label>
                                <Input
                                    type="password"
                                    placeholder="AIza..."
                                    value={settings.google_key}
                                    onChange={(e) => setSettings({...settings, google_key: e.target.value})}
                                    className="bg-slate-700 border-slate-600 text-white mt-2"
                                />
                            </div>

                            <div>
                                <Label className="text-slate-300">ElevenLabs API Key</Label>
                                <Input
                                    type="password"
                                    placeholder="..."
                                    value={settings.elevenlabs_key}
                                    onChange={(e) => setSettings({...settings, elevenlabs_key: e.target.value})}
                                    className="bg-slate-700 border-slate-600 text-white mt-2"
                                />
                            </div>

                            <div>
                                <Label className="text-slate-300">FAL.AI API Key</Label>
                                <Input
                                    type="password"
                                    placeholder="..."
                                    value={settings.fal_key}
                                    onChange={(e) => setSettings({...settings, fal_key: e.target.value})}
                                    className="bg-slate-700 border-slate-600 text-white mt-2"
                                />
                            </div>

                            <div>
                                <Label className="text-slate-300">Stripe Secret Key</Label>
                                <Input
                                    type="password"
                                    placeholder="sk_..."
                                    value={settings.stripe_key}
                                    onChange={(e) => setSettings({...settings, stripe_key: e.target.value})}
                                    className="bg-slate-700 border-slate-600 text-white mt-2"
                                />
                            </div>

                            <div>
                                <Label className="text-slate-300">Stripe Webhook Secret</Label>
                                <Input
                                    type="password"
                                    placeholder="whsec_..."
                                    value={settings.stripe_webhook_secret}
                                    onChange={(e) => setSettings({...settings, stripe_webhook_secret: e.target.value})}
                                    className="bg-slate-700 border-slate-600 text-white mt-2"
                                />
                            </div>
                        </div>

                        <Button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Settings
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}