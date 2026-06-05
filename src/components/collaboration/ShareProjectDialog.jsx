import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Share2, CheckCircle2, UserPlus } from "lucide-react";

export default function ShareProjectDialog({ project, isOpen, onClose }) {
    const [email, setEmail] = useState('');
    const [permission, setPermission] = useState('view');
    const [message, setMessage] = useState('');
    const [collaborators, setCollaborators] = useState([]);
    const [isSharing, setIsSharing] = useState(false);

    useEffect(() => {
        if (isOpen && project) {
            loadCollaborators();
        }
    }, [isOpen, project]);

    const loadCollaborators = async () => {
        try {
            const collabs = await base44.entities.Collaboration.filter({ project_id: project.id });
            setCollaborators(collabs);
        } catch (err) {
            console.error('Error loading collaborators:', err);
        }
    };

    const handleShare = async () => {
        if (!email.trim()) return;

        setIsSharing(true);

        try {
            await base44.entities.Collaboration.create({
                project_id: project.id,
                shared_with_email: email,
                permission_level: permission,
                invitation_message: message,
                invitation_status: 'pending'
            });

            // Send email notification
            await base44.integrations.Core.SendEmail({
                to: email,
                subject: `You've been invited to collaborate on "${project.title}"`,
                body: `
                    Hi!
                    
                    You've been invited to collaborate on the project "${project.title}".
                    
                    ${message ? `Message: ${message}` : ''}
                    
                    Log in to start collaborating!
                `
            });

            setEmail('');
            setMessage('');
            await loadCollaborators();
        } catch (err) {
            console.error('Share error:', err);
            alert('Failed to share project');
        } finally {
            setIsSharing(false);
        }
    };

    const getPermissionColor = (perm) => {
        const colors = {
            view: 'bg-blue-100 text-blue-800',
            comment: 'bg-green-100 text-green-800',
            edit: 'bg-amber-100 text-amber-800',
            admin: 'bg-red-100 text-red-800'
        };
        return colors[perm] || 'bg-gray-100 text-gray-800';
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-blue-500" />
                        Share "{project?.title}"
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Share Form */}
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Email Address</label>
                            <Input
                                type="email"
                                placeholder="colleague@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Permission Level</label>
                            <Select value={permission} onValueChange={setPermission}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="view">View Only</SelectItem>
                                    <SelectItem value="comment">Can Comment</SelectItem>
                                    <SelectItem value="edit">Can Edit</SelectItem>
                                    <SelectItem value="admin">Full Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Message (Optional)</label>
                            <Input
                                placeholder="Add a personal message..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                        </div>

                        <Button
                            onClick={handleShare}
                            disabled={!email.trim() || isSharing}
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-500"
                        >
                            {isSharing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Sending Invitation...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Send Invitation
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Current Collaborators */}
                    <div>
                        <h3 className="font-semibold mb-3">Collaborators ({collaborators.length})</h3>
                        {collaborators.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">
                                No collaborators yet. Invite team members above!
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {collaborators.map((collab) => (
                                    <div key={collab.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                                                {collab.shared_with_email.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{collab.shared_with_email}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className={`text-xs ${getPermissionColor(collab.permission_level)}`}>
                                                        {collab.permission_level}
                                                    </Badge>
                                                    {collab.invitation_status === 'accepted' ? (
                                                        <Badge className="bg-green-500 text-white text-xs">
                                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                                            Accepted
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-xs">
                                                            Pending
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}