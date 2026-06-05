import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminUserManagement() {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setIsLoading(true);
        setError('');
        try {
            const { data } = await base44.functions.invoke('adminGetUsers');
            if (data.error) {
                throw new Error(data.error);
            }
            setUsers(data.users || []);
        } catch (err) {
            console.error('Error loading users:', err);
            setError(err.message || 'Failed to load users. Please check your admin permissions.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateUserTier = async (userId, newTier) => {
        try {
            const { data } = await base44.functions.invoke('adminUpdateUser', {
                userId,
                updates: { plan_type: newTier }
            });

            if (data.error) {
                throw new Error(data.error);
            }
            
            setSuccess(`User tier updated to ${newTier}`);
            setTimeout(() => setSuccess(''), 3000);
            await loadUsers();
        } catch (err) {
            console.error('Error updating user tier:', err);
            setError(err.message || 'Failed to update user tier');
            setTimeout(() => setError(''), 3000);
        }
    };

    const filteredUsers = users.filter(user => 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">User Management</h1>
                    <p className="text-slate-400">Manage users, plans, and permissions</p>
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
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-white flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                All Users ({filteredUsers.length})
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="Search users..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 bg-slate-700 border-slate-600 text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-12">
                                <div className="w-8 h-8 border-2 border-blue-400 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-slate-400">Loading users...</p>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-slate-400">No users found</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-all"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-white font-medium">{user.full_name || 'Unknown'}</h3>
                                                    <Badge variant={user.role === 'admin' ? 'default' : 'outline'} className="text-xs">
                                                        {user.role}
                                                    </Badge>
                                                    <Badge 
                                                        variant="outline" 
                                                        className={`text-xs ${
                                                            user.plan_type === 'enterprise' ? 'border-purple-500 text-purple-400' :
                                                            user.plan_type === 'pro' ? 'border-blue-500 text-blue-400' :
                                                            'border-gray-500 text-gray-400'
                                                        }`}
                                                    >
                                                        {user.plan_type || 'free'}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                                    <Mail className="w-3 h-3" />
                                                    {user.email}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Joined: {new Date(user.created_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Select
                                                    value={user.plan_type || 'free'}
                                                    onValueChange={(value) => handleUpdateUserTier(user.id, value)}
                                                >
                                                    <SelectTrigger className="w-32 bg-slate-600 border-slate-500 text-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="free">Free</SelectItem>
                                                        <SelectItem value="pro">Pro</SelectItem>
                                                        <SelectItem value="enterprise">Enterprise</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}