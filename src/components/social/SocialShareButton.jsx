import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Share2, Youtube, Instagram, Twitter, Linkedin, CheckCircle2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";

const PLATFORMS = [
    { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-red-600' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-600' },
    { id: 'twitter', name: 'Twitter', icon: Twitter, color: 'text-blue-400' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' }
];

export default function SocialShareButton({ videoId, videoTitle }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState(null);
    const [title, setTitle] = useState(videoTitle || '');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [exportSuccess, setExportSuccess] = useState(false);

    const handleExport = async () => {
        if (!selectedPlatform) return;

        setIsExporting(true);
        setExportSuccess(false);

        try {
            const { data } = await base44.functions.invoke('exportToSocial', {
                video_id: videoId,
                platform: selectedPlatform,
                title: title,
                description: description,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                visibility: 'public'
            });

            if (data.error) {
                if (data.action_required === 'connect_account') {
                    alert(`Please connect your ${selectedPlatform} account first in Settings`);
                } else {
                    throw new Error(data.error);
                }
            } else {
                setExportSuccess(true);
                setTimeout(() => {
                    setIsOpen(false);
                    setExportSuccess(false);
                }, 2000);
            }
        } catch (err) {
            console.error('Export error:', err);
            alert(err.message || 'Failed to export to social media');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <>
            <Button
                variant="outline"
                onClick={() => setIsOpen(true)}
                className="gap-2"
            >
                <Share2 className="w-4 h-4" />
                Share to Social
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Share to Social Media</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {!selectedPlatform ? (
                            <>
                                <p className="text-sm text-gray-600">Choose a platform:</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {PLATFORMS.map((platform) => {
                                        const Icon = platform.icon;
                                        return (
                                            <motion.div key={platform.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                                <Button
                                                    variant="outline"
                                                    className="w-full h-20 flex flex-col gap-2"
                                                    onClick={() => setSelectedPlatform(platform.id)}
                                                >
                                                    <Icon className={`w-8 h-8 ${platform.color}`} />
                                                    <span className="text-sm">{platform.name}</span>
                                                </Button>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                    {React.createElement(PLATFORMS.find(p => p.id === selectedPlatform).icon, { className: 'w-5 h-5' })}
                                    <span className="font-medium">{PLATFORMS.find(p => p.id === selectedPlatform).name}</span>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedPlatform(null)} className="ml-auto">
                                        Change
                                    </Button>
                                </div>

                                <div>
                                    <Label>Title</Label>
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Video title..."
                                    />
                                </div>

                                <div>
                                    <Label>Description</Label>
                                    <Textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Video description..."
                                        className="min-h-[100px]"
                                    />
                                </div>

                                <div>
                                    <Label>Tags (comma-separated)</Label>
                                    <Input
                                        value={tags}
                                        onChange={(e) => setTags(e.target.value)}
                                        placeholder="ai, video, tutorial"
                                    />
                                </div>

                                {exportSuccess ? (
                                    <Alert className="border-green-500 bg-green-50">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <AlertDescription className="ml-2 text-green-800">
                                            Video queued for export to {PLATFORMS.find(p => p.id === selectedPlatform).name}!
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <Button
                                        onClick={handleExport}
                                        disabled={!title.trim() || isExporting}
                                        className="w-full bg-gradient-to-r from-blue-500 to-purple-500"
                                    >
                                        {isExporting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                Exporting...
                                            </>
                                        ) : (
                                            <>
                                                <Share2 className="w-4 h-4 mr-2" />
                                                Export to {PLATFORMS.find(p => p.id === selectedPlatform).name}
                                            </>
                                        )}
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}