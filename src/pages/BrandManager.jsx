import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Palette, Upload, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function BrandManager() {
    const [brandKits, setBrandKits] = useState([]);
    const [selectedKit, setSelectedKit] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        brand_name: '',
        watermark_position: 'bottom-right',
        watermark_opacity: 0.7
    });

    useEffect(() => {
        loadBrandKits();
    }, []);

    const loadBrandKits = async () => {
        try {
            const user = await base44.auth.me();
            const kits = await base44.entities.BrandKit.filter({ created_by: user.email });
            setBrandKits(kits);
        } catch (err) {
            console.error('Error loading brand kits:', err);
        }
    };

    const handleLogoUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            setFormData({ ...formData, logo_url: file_url });
        } catch (err) {
            console.error('Logo upload error:', err);
        }
    };

    const handleWatermarkUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            setFormData({ ...formData, watermark_url: file_url });
        } catch (err) {
            console.error('Watermark upload error:', err);
        }
    };

    const handleSave = async () => {
        try {
            if (selectedKit) {
                await base44.entities.BrandKit.update(selectedKit.id, formData);
            } else {
                await base44.entities.BrandKit.create(formData);
            }
            
            setIsEditing(false);
            setSelectedKit(null);
            setFormData({ brand_name: '', watermark_position: 'bottom-right', watermark_opacity: 0.7 });
            await loadBrandKits();
        } catch (err) {
            console.error('Save error:', err);
        }
    };

    const handleEdit = (kit) => {
        setSelectedKit(kit);
        setFormData(kit);
        setIsEditing(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-100 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">Brand Kits</h1>
                        <p className="text-gray-600">Manage your brand identity across all videos</p>
                    </div>
                    <Button
                        onClick={() => {
                            setIsEditing(true);
                            setSelectedKit(null);
                            setFormData({ brand_name: '', watermark_position: 'bottom-right', watermark_opacity: 0.7 });
                        }}
                        className="bg-gradient-to-r from-purple-500 to-indigo-500"
                    >
                        <Palette className="w-4 h-4 mr-2" />
                        Create Brand Kit
                    </Button>
                </div>

                {brandKits.length === 0 ? (
                    <Card className="text-center py-12">
                        <CardContent>
                            <Palette className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-xl font-semibold mb-2">No Brand Kits Yet</h3>
                            <p className="text-gray-600 mb-4">Create your first brand kit to maintain consistent branding</p>
                            <Button
                                onClick={() => setIsEditing(true)}
                                className="bg-gradient-to-r from-purple-500 to-indigo-500"
                            >
                                Create Brand Kit
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {brandKits.map((kit) => (
                            <motion.div key={kit.id} whileHover={{ scale: 1.02 }}>
                                <Card className="hover:shadow-xl transition-all cursor-pointer" onClick={() => handleEdit(kit)}>
                                    <CardHeader>
                                        <div className="flex items-center gap-3 mb-3">
                                            {kit.logo_url ? (
                                                <img src={kit.logo_url} alt={kit.brand_name} className="w-12 h-12 object-contain" />
                                            ) : (
                                                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-lg flex items-center justify-center">
                                                    <Palette className="w-6 h-6 text-white" />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <CardTitle className="text-lg">{kit.brand_name}</CardTitle>
                                                {kit.is_active && (
                                                    <Badge className="bg-green-500 text-white text-xs mt-1">
                                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                                        Active
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2 text-sm text-gray-600">
                                            {kit.watermark_url && (
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                    <span>Watermark configured</span>
                                                </div>
                                            )}
                                            {kit.brand_colors && (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex gap-1">
                                                        {Object.values(kit.brand_colors).filter(Boolean).slice(0, 3).map((color, i) => (
                                                            <div key={i} className="w-4 h-4 rounded-full border" style={{ backgroundColor: color }} />
                                                        ))}
                                                    </div>
                                                    <span>Brand colors set</span>
                                                </div>
                                            )}
                                            {kit.default_music_track_id && (
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                    <span>Default music selected</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Edit Dialog */}
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {selectedKit ? 'Edit Brand Kit' : 'Create Brand Kit'}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6">
                            <div>
                                <Label>Brand Name</Label>
                                <Input
                                    value={formData.brand_name}
                                    onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                                    placeholder="My Brand"
                                />
                            </div>

                            <div>
                                <Label>Logo</Label>
                                <div className="flex items-center gap-3">
                                    {formData.logo_url && (
                                        <img src={formData.logo_url} alt="Logo" className="w-16 h-16 object-contain border rounded" />
                                    )}
                                    <Button variant="outline" onClick={() => document.getElementById('logo-upload').click()}>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload Logo
                                    </Button>
                                    <input
                                        id="logo-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        className="hidden"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Watermark</Label>
                                <div className="flex items-center gap-3">
                                    {formData.watermark_url && (
                                        <img src={formData.watermark_url} alt="Watermark" className="w-16 h-16 object-contain border rounded bg-gray-100" />
                                    )}
                                    <Button variant="outline" onClick={() => document.getElementById('watermark-upload').click()}>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload Watermark
                                    </Button>
                                    <input
                                        id="watermark-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleWatermarkUpload}
                                        className="hidden"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Watermark Position</Label>
                                    <Select
                                        value={formData.watermark_position}
                                        onValueChange={(value) => setFormData({ ...formData, watermark_position: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="top-left">Top Left</SelectItem>
                                            <SelectItem value="top-right">Top Right</SelectItem>
                                            <SelectItem value="bottom-left">Bottom Left</SelectItem>
                                            <SelectItem value="bottom-right">Bottom Right</SelectItem>
                                            <SelectItem value="center">Center</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Watermark Opacity</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={formData.watermark_opacity}
                                        onChange={(e) => setFormData({ ...formData, watermark_opacity: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                                    Cancel
                                </Button>
                                <Button onClick={handleSave} className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500">
                                    Save Brand Kit
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}