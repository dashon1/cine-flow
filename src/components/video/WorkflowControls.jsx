import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Zap, Hand, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function WorkflowControls({ mode, onModeChange, userTier }) {
    const canUseManualReview = ['pro', 'enterprise'].includes(userTier);

    return (
        <Card className="bg-white/60 backdrop-blur-sm border-gray-200">
            <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Workflow Mode
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="workflow-mode">Auto-Complete</Label>
                        <Badge variant="outline" className="text-xs">
                            {mode === 'auto' ? 'ON' : 'OFF'}
                        </Badge>
                    </div>
                    <Switch
                        id="workflow-mode"
                        checked={mode === 'auto'}
                        onCheckedChange={(checked) => onModeChange(checked ? 'auto' : 'manual_review')}
                        disabled={mode === 'manual_review' && !canUseManualReview}
                    />
                </div>

                <Alert className="border-blue-500 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-xs text-blue-800 ml-2">
                        {mode === 'auto' ? (
                            <>
                                <strong>Auto Mode:</strong> Video generates from start to finish without stops. 
                                Faster but less control.
                            </>
                        ) : (
                            <>
                                <strong>Manual Review:</strong> Review and edit images, voiceovers, and scenes 
                                before final video generation. More control.
                            </>
                        )}
                    </AlertDescription>
                </Alert>

                {!canUseManualReview && mode !== 'auto' && (
                    <Alert className="border-amber-500 bg-amber-50">
                        <AlertDescription className="text-xs text-amber-800">
                            <Hand className="w-3 h-3 inline mr-1" />
                            Manual Review is available on Pro and Enterprise plans
                        </AlertDescription>
                    </Alert>
                )}

                <div className="pt-2 border-t space-y-2 text-xs text-gray-600">
                    <p><strong>Auto Mode Stops:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>After storyboard (editable)</li>
                        <li>After final video</li>
                    </ul>
                    {canUseManualReview && (
                        <>
                            <p className="pt-2"><strong>Manual Review Stops:</strong></p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>After storyboard</li>
                                <li>After each image generation</li>
                                <li>After voiceover generation</li>
                                <li>Before final assembly</li>
                            </ul>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}