import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download, Maximize, Clock } from "lucide-react";

export default function ExportSettings({ settings, onUpdate }) {
    return (
        <Card className="bg-white/60 backdrop-blur-sm border-gray-200">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Download className="w-5 h-5 text-amber-500" />
                    Export Settings
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label className="text-sm mb-2 block flex items-center gap-1">
                        <Maximize className="w-4 h-4" />
                        Aspect Ratio
                    </Label>
                    <Select
                        value={settings.aspect_ratio || '16:9'}
                        onValueChange={(value) => onUpdate({ ...settings, aspect_ratio: value })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="16:9">16:9 (Widescreen - YouTube)</SelectItem>
                            <SelectItem value="9:16">9:16 (Vertical - TikTok/Stories)</SelectItem>
                            <SelectItem value="1:1">1:1 (Square - Instagram)</SelectItem>
                            <SelectItem value="4:3">4:3 (Classic)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label className="text-sm mb-2 block">Resolution</Label>
                    <Select
                        value={settings.resolution || '1080p'}
                        onValueChange={(value) => onUpdate({ ...settings, resolution: value })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="720p">720p (HD)</SelectItem>
                            <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="pt-2 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                        <p><strong>Output Format:</strong> MP4 (H.264)</p>
                        <p className="mt-1">
                            <strong>Estimated Size:</strong>{' '}
                            {settings.resolution === '1080p' ? '15-30 MB' : '8-15 MB'} per minute
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}