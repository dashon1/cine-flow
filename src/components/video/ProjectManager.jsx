import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { Save, FolderOpen, Trash2, Clock, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ProjectManager({ currentProject, onLoad, onSave }) {
    const [projects, setProjects] = useState([]);
    const [projectName, setProjectName] = useState(currentProject?.title || '');
    const [showSaved, setShowSaved] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadProjects();
    }, []);

    useEffect(() => {
        if (currentProject?.title) {
            setProjectName(currentProject.title);
        }
    }, [currentProject?.title]);

    const loadProjects = async () => {
        setIsLoading(true);
        try {
            const allProjects = await base44.entities.Project.list('-updated_date', 20);
            setProjects(allProjects);
        } catch (err) {
            console.error('Error loading projects:', err);
            setError('Failed to load projects');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!projectName.trim()) {
            setError('Please enter a project name');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            const projectData = {
                title: projectName,
                script: currentProject?.script || '',
                language: currentProject?.language || 'en',
                storyboard: currentProject?.storyboard || null,
                images: currentProject?.images || [],
                voiceovers: currentProject?.voiceovers || [],
                video_url: currentProject?.video_url || '',
                settings: currentProject?.settings || {},
                status: 'draft'
            };

            let savedProject;
            if (currentProject?.id) {
                savedProject = await base44.entities.Project.update(currentProject.id, projectData);
            } else {
                savedProject = await base44.entities.Project.create(projectData);
            }

            onSave({ ...savedProject, ...projectData });
            setShowSaved(true);
            setTimeout(() => setShowSaved(false), 3000);
            await loadProjects();
        } catch (err) {
            console.error('Error saving project:', err);
            setError('Failed to save project. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoad = async (project) => {
        try {
            onLoad(project);
            setProjectName(project.title);
        } catch (err) {
            console.error('Error loading project:', err);
            setError('Failed to load project');
        }
    };

    const handleDelete = async (projectId) => {
        if (!window.confirm('Are you sure you want to delete this project? This cannot be undone.')) return;

        setIsLoading(true);
        try {
            await base44.entities.Project.delete(projectId);
            await loadProjects();
            
            // If we deleted the currently loaded project, clear it
            if (currentProject?.id === projectId) {
                onLoad({});
                setProjectName('');
            }
        } catch (err) {
            console.error('Error deleting project:', err);
            setError('Failed to delete project');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <Card className="bg-white/60 backdrop-blur-sm border-gray-200">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Save className="w-5 h-5 text-amber-500" />
                        Save Project
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div>
                        <Input
                            placeholder="Project name..."
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            className="mb-2"
                            disabled={isLoading}
                        />
                        <Button
                            onClick={handleSave}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                            disabled={!projectName.trim() || isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </div>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    {currentProject?.id ? 'Update Project' : 'Save New Project'}
                                </>
                            )}
                        </Button>
                    </div>

                    <AnimatePresence>
                        {showSaved && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <Alert className="border-green-500 bg-green-50">
                                    <AlertDescription className="text-green-700 text-sm">
                                        Project saved successfully!
                                    </AlertDescription>
                                </Alert>
                            </motion.div>
                        )}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <Alert className="border-red-500 bg-red-50">
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                    <AlertDescription className="text-red-700 text-sm">
                                        {error}
                                    </AlertDescription>
                                </Alert>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>

            <Card className="bg-white/60 backdrop-blur-sm border-gray-200">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FolderOpen className="w-5 h-5 text-amber-500" />
                        My Projects
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading && projects.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="w-8 h-8 border-2 border-amber-400 border-t-amber-500 rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Loading projects...</p>
                        </div>
                    ) : projects.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                            No saved projects yet
                        </p>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {projects.map((project) => (
                                <div
                                    key={project.id}
                                    className={`
                                        p-3 bg-white rounded-lg border transition-all
                                        ${currentProject?.id === project.id 
                                            ? 'border-amber-400 bg-amber-50' 
                                            : 'border-gray-200 hover:border-amber-300'
                                        }
                                    `}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium text-gray-900 truncate">
                                                {project.title}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <Badge variant="outline" className="text-xs">
                                                    {project.status || 'draft'}
                                                </Badge>
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(project.updated_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 flex-shrink-0">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleLoad(project)}
                                                className="h-7 text-blue-600 hover:bg-blue-50"
                                                disabled={isLoading}
                                            >
                                                <FolderOpen className="w-3 h-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(project.id)}
                                                className="h-7 text-red-600 hover:bg-red-50"
                                                disabled={isLoading}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}