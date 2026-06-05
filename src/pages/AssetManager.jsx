import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music, Video, Upload, Search, Heart, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

export default function AssetManager() {
    const [assets, setAssets] = useState([]);
    const [filteredAssets, setFilteredAssets] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeType, setActiveType] = useState('all');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        loadAssets();
    }, []);

    useEffect(() => {
        filterAssets();
    }, [searchTerm, activeType, assets]);

    const loadAssets = async () => {
        try {
            const user = await base44.auth.me();
            const allAssets = await base44.entities.AssetLibrary.filter({ created_by: user.email });
            setAssets(allAssets);
        } catch (err) {
            console.error('Error loading assets:', err);
        }
    };

    const filterAssets = () => {
        let filtered = assets;

        if (activeType !== 'all') {
            filtered = filtered.filter(a => a.asset_type === activeType);
        }

        if (searchTerm) {
            filtered = filtered.filter(a =>
                a.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                a.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        setFilteredAssets(filtered);
    };

    const handleUpload = async (event, assetType) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploading(true);

        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });

            await base44.entities.AssetLibrary.create({
                asset_name: file.name,
                asset_type: assetType,
                file_url: file_url,
                tags: [],
                metadata: {
                    file_size: file.size,
                    format: file.type
                }
            });

            await loadAssets();
        } catch (err) {
            console.error('Upload error:', err);
        } finally {
            setIsUploading(false);
        }
    };

    const toggleFavorite = async (assetId, currentStatus) => {
        try {
            await base44.entities.AssetLibrary.update(assetId, {
                is_favorite: !currentStatus
            });
            await loadAssets();
        } catch (err) {
            console.error('Error toggling favorite:', err);
        }
    };

    const handleDelete = async (assetId) => {
        if (!window.confirm('Delete this asset?')) return;

        try {
            await base44.entities.AssetLibrary.delete(assetId);
            await loadAssets();
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-100 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">Asset Library</h1>
                        <p className="text-gray-600">Manage your images, audio, and video clips</p>
                    </div>
                </div>

                <div className="mb-6 flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search assets..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                <Tabs value={activeType} onValueChange={setActiveType}>
                    <TabsList className="grid w-full grid-cols-5 max-w-2xl mb-6">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="image">Images</TabsTrigger>
                        <TabsTrigger value="audio">Audio</TabsTrigger>
                        <TabsTrigger value="video_clip">Videos</TabsTrigger>
                        <TabsTrigger value="logo">Logos</TabsTrigger>
                    </TabsList>

                    <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {/* Upload Cards */}
                        <Card className="border-2 border-dashed border-gray-300 hover:border-teal-400 cursor-pointer transition-all">
                            <CardContent className="p-6 text-center">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleUpload(e, 'image')}
                                    className="hidden"
                                    id="upload-image"
                                />
                                <label htmlFor="upload-image" className="cursor-pointer">
                                    <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                    <p className="text-sm text-gray-600">Upload Image</p>
                                </label>
                            </CardContent>
                        </Card>

                        <Card className="border-2 border-dashed border-gray-300 hover:border-teal-400 cursor-pointer transition-all">
                            <CardContent className="p-6 text-center">
                                <input
                                    type="file"
                                    accept="audio/*"
                                    onChange={(e) => handleUpload(e, 'audio')}
                                    className="hidden"
                                    id="upload-audio"
                                />
                                <label htmlFor="upload-audio" className="cursor-pointer">
                                    <Music className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                    <p className="text-sm text-gray-600">Upload Audio</p>
                                </label>
                            </CardContent>
                        </Card>

                        {/* Asset Grid */}
                        {filteredAssets.map((asset) => (
                            <motion.div key={asset.id} whileHover={{ scale: 1.02 }}>
                                <Card className="overflow-hidden hover:shadow-lg transition-all h-full">
                                    <div className="relative h-40 bg-gray-100">
                                        {asset.asset_type === 'image' || asset.asset_type === 'logo' ? (
                                            <img
                                                src={asset.file_url}
                                                alt={asset.asset_name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : asset.asset_type === 'audio' ? (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-pink-400">
                                                <Music className="w-12 h-12 text-white" />
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-teal-400">
                                                <Video className="w-12 h-12 text-white" />
                                            </div>
                                        )}

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                                            onClick={() => toggleFavorite(asset.id, asset.is_favorite)}
                                        >
                                            <Heart className={`w-4 h-4 ${asset.is_favorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                                        </Button>
                                    </div>

                                    <CardContent className="p-3">
                                        <p className="font-medium text-sm truncate mb-2">{asset.asset_name}</p>
                                        
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            <Badge variant="outline" className="text-xs">
                                                {asset.asset_type}
                                            </Badge>
                                            {asset.metadata?.file_size && (
                                                <Badge variant="outline" className="text-xs">
                                                    {formatFileSize(asset.metadata.file_size)}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => window.open(asset.file_url, '_blank')}
                                                className="flex-1 text-xs"
                                            >
                                                View
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(asset.id)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </Tabs>
            </div>
        </div>
    );
}