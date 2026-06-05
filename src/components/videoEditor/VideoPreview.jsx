import React, { useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";

export default function VideoPreview({ 
    videoRef, 
    videoUrl, 
    isPlaying, 
    filters, 
    textOverlays, 
    currentTime,
    onLoadedMetadata,
    onTimeUpdate
}) {
    const canvasRef = useRef(null);
    
    useEffect(() => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const video = videoRef.current;
            
            const renderFrame = () => {
                if (!video.paused && !video.ended) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    
                    ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) blur(${filters.blur}px) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%)`;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    
                    textOverlays.forEach(overlay => {
                        if (currentTime >= overlay.startTime && currentTime <= overlay.endTime) {
                            ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
                            ctx.fillStyle = overlay.color;
                            ctx.textAlign = overlay.align || 'center';
                            ctx.strokeStyle = overlay.strokeColor || '#000000';
                            ctx.lineWidth = overlay.strokeWidth || 0;
                            
                            if (overlay.strokeWidth > 0) {
                                ctx.strokeText(overlay.text, overlay.x, overlay.y);
                            }
                            ctx.fillText(overlay.text, overlay.x, overlay.y);
                        }
                    });
                    
                    requestAnimationFrame(renderFrame);
                }
            };
            
            if (isPlaying) {
                renderFrame();
            }
        }
    }, [isPlaying, filters, textOverlays, currentTime, videoRef]);
    
    return (
        <Card className="overflow-hidden">
            <div className="relative bg-black aspect-video">
                <video
                    ref={videoRef}
                    src={videoUrl}
                    onLoadedMetadata={onLoadedMetadata}
                    onTimeUpdate={onTimeUpdate}
                    className="hidden"
                />
                <canvas
                    ref={canvasRef}
                    className="w-full h-full object-contain"
                />
            </div>
        </Card>
    );
}