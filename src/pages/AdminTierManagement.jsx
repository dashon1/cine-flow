import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { UserTier } from '@/entities/UserTier';
import { User } from '@/entities/User';
import { AuditLog } from '@/entities/AuditLog';
import { Plus, Edit2, Save, X, Users, Crown, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminTierManagement() {
    const [tiers, setTiers] = useState([]);
    const [users, setUsers] = useState([]);
    const [editingTier, setEditingTier] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [currentUser, setCurrentUser] = useState(null);

    const [formData, setFormData] = useState({
        tier_name: 'free',
        display_name: '',
        daily_video_limit: 3,
        daily_image_limit: 50,
        daily_voiceover_limit: 50,
        concurrent_jobs_limit: 1,
        max_video_duration: 60,
        features: {
            auto_workflow: true,
            manual_review: false,
            custom_models: false,
            priority_processing: false,
            export_formats: ['webm']
        },
        is_active: true,
        price_monthly: 0
    });

    useEffect(() => {
        loadCurrentUser();
        loadTiers();
        loadUsers();
    }, []);

    const loadCurrentUser = async () => {
        const user = await User.me();
        setCurrentUser(user);
    };

    const loadTiers = async () => {
        const allTiers = await UserTier.list();
        setTiers(allTiers);
    };

    const loadUsers = async () => {
        const allUsers = await User.list();
        setUsers(allUsers);
    };

    const logAction = async (action, description, targetEntity, oldValue, newValue) => {
        if (!currentUser) return;
        await AuditLog.create({
            action_type: action,
            action_description: description,
            target_entity: targetEntity,
            old_value: JSON.stringify(oldValue),
            new_value: JSON.stringify(newValue),
            admin_email: currentUser.email
        });
    };

    const handleSave = async () => {
        try {
            if (editingTier) {
                await UserTier.update(editingTier.id, formData);
                await logAction('tier_change', `Updated tier: ${formData.tier_name}`, editingTier.id, editingTier, formData);
                setMessage({ type: 'success', text: 'Tier updated successfully!' });
            } else {
                const newTier = await UserTier.create(formData);
                await logAction('tier_change', `Created tier: ${formData.tier_name}`, newTier.id, null, formData);
                setMessage({ type: 'success', text: 'Tier created successfully!' });
            }

            loadTiers();
            resetForm();
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Failed to save tier' });
        }
    };

    const handleEdit = (tier) => {
        setEditingTier(tier);
        setFormData(tier);
        setShowForm(true);
    };

    const handleUserTierChange = async (user, newTier) => {
        if (!window.confirm(`Change ${user.email}'s tier to ${newTier}?`)) return;

        try {
            const oldTier = user.plan_type;
            await User.update(user.id, { plan_type: newTier });
            await logAction('user_tier_update', `Changed ${user.email} from ${oldTier} to ${newTier}`, user.id, { plan_type: oldTier }, { plan_type: newTier });
            setMessage({ type: 'success', text: 'User tier updated!' });
            loadUsers();
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to update user tier' });
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingTier(null);
        setFormData({
            tier_name: 'free',
            display_name: '',
            daily_video_limit: 3,
            daily_image_limit: 50,
            daily_voiceover_limit: 50,
            concurrent_jobs_limit: 1,
            max_video_duration: 60,
            features: {
                auto_workflow: true,
                manual_review: false,
                custom_models: false,
                priority_processing: false,
                export_formats: ['webm']
            },
            is_active: true,
            price_monthly: 0
        });
    };

    const getTierIcon = (tierName) => {
        switch (tierName) {
            case 'enterprise': return <Crown className="w-5 h-5 text-purple-600" />;
            case 'pro': return <Zap className="w-5 h-5 text-amber-600" />;
            default: return <Users className="w-5 h-5 text-blue-600" />;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Users className="w-8 h-8 text-amber-500" />
                            Tier Management
                        </h1>
                        <p className="text-gray-600 mt-2">Configure subscription tiers and manage user access</p>
                    </div>
                    <Button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-gradient-to-r from-amber-500 to-orange-500"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Tier
                    </Button>
                </div>

                {message.text && (
                    <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                        <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                            {message.text}
                        </AlertDescription>
                    </Alert>
                )}

                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <Card className="mb-6 bg-white/80 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span>{editingTier ? 'Edit Tier' : 'Add New Tier'}</span>
                                        <Button variant="ghost" size="sm" onClick={resetForm}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Display Name</Label>
                                            <Input
                                                value={formData.display_name}
                                                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                                                placeholder="e.g., Professional Plan"
                                            />
                                        </div>
                                        <div>
                                            <Label>Monthly Price ($)</Label>
                                            <Input
                                                type="number"
                                                value={formData.price_monthly}
                                                onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <Label>Daily Video Limit</Label>
                                            <Input
                                                type="number"
                                                value={formData.daily_video_limit}
                                                onChange={(e) => setFormData({ ...formData, daily_video_limit: parseInt(e.target.value) })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Daily Image Limit</Label>
                                            <Input
                                                type="number"
                                                value={formData.daily_image_limit}
                                                onChange={(e) => setFormData({ ...formData, daily_image_limit: parseInt(e.target.value) })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Daily Voiceover Limit</Label>
                                            <Input
                                                type="number"
                                                value={formData.daily_voiceover_limit}
                                                onChange={(e) => setFormData({ ...formData, daily_voiceover_limit: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Concurrent Jobs Limit</Label>
                                            <Input
                                                type="number"
                                                value={formData.concurrent_jobs_limit}
                                                onChange={(e) => setFormData({ ...formData, concurrent_jobs_limit: parseInt(e.target.value) })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Max Video Duration (seconds)</Label>
                                            <Input
                                                type="number"
                                                value={formData.max_video_duration}
                                                onChange={(e) => setFormData({ ...formData, max_video_duration: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="mb-2 block">Features</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {Object.keys(formData.features).map((feature) => {
                                                if (feature === 'export_formats') return null;
                                                return (
                                                    <div key={feature} className="flex items-center gap-2">
                                                        <Switch
                                                            checked={formData.features[feature]}
                                                            onCheckedChange={(checked) => setFormData({
                                                                ...formData,
                                                                features: { ...formData.features, [feature]: checked }
                                                            })}
                                                        />
                                                        <Label className="capitalize">{feature.replace(/_/g, ' ')}</Label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={formData.is_active}
                                            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                        />
                                        <Label>Active</Label>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button onClick={handleSave} className="bg-gradient-to-r from-amber-500 to-orange-500">
                                            <Save className="w-4 h-4 mr-2" />
                                            {editingTier ? 'Update Tier' : 'Create Tier'}
                                        </Button>
                                        <Button variant="outline" onClick={resetForm}>
                                            Cancel
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {tiers.map((tier) => (
                        <Card key={tier.id} className="bg-white/80 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        {getTierIcon(tier.tier_name)}
                                        <div>
                                            <h3 className="text-lg font-semibold capitalize">{tier.display_name || tier.tier_name}</h3>
                                            <p className="text-sm text-gray-500">
                                                {tier.price_monthly > 0 ? `$${tier.price_monthly}/month` : 'Free'}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(tier)}
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Daily Videos:</span>
                                        <Badge variant="outline">{tier.daily_video_limit}</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Daily Images:</span>
                                        <Badge variant="outline">{tier.daily_image_limit}</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Daily Voiceovers:</span>
                                        <Badge variant="outline">{tier.daily_voiceover_limit}</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Max Duration:</span>
                                        <Badge variant="outline">{tier.max_video_duration}s</Badge>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t">
                                    <p className="text-xs text-gray-500 mb-2">Features:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {Object.entries(tier.features || {}).map(([key, value]) => {
                                            if (key === 'export_formats' || !value) return null;
                                            return (
                                                <Badge key={key} className="text-xs bg-blue-100 text-blue-800">
                                                    {key.replace(/_/g, ' ')}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card className="bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>User Tier Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {users.map((user) => (
                                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium">{user.full_name || user.email}</p>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge className={`capitalize ${
                                            user.plan_type === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                                            user.plan_type === 'pro' ? 'bg-amber-100 text-amber-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                            {user.plan_type || 'free'}
                                        </Badge>
                                        <select
                                            value={user.plan_type || 'free'}
                                            onChange={(e) => handleUserTierChange(user, e.target.value)}
                                            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                                        >
                                            <option value="free">Free</option>
                                            <option value="pro">Pro</option>
                                            <option value="enterprise">Enterprise</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}