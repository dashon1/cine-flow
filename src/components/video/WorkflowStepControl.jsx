
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Check } from "lucide-react";
import ModelSelector from './ModelSelector';

export default function WorkflowStepControl({
    stepNumber,
    title,
    icon: Icon,
    description,
    status, // 'pending', 'current', 'completed'
    models,
    selectedModelId,
    onModelSelect,
    onProceed,
    isProcessing,
    canProceed,
    children,
    color = "blue",
    processingButtonText = "Processing...",
    proceedButtonText = "Continue to Next Step"
}) {
    const [isExpanded, setIsExpanded] = React.useState(status === 'current');

    React.useEffect(() => {
        if (status === 'current') {
            setIsExpanded(true);
        }
    }, [status]);

    const getStatusColor = () => {
        switch (status) {
            case 'completed':
                return 'from-green-500 to-emerald-500';
            case 'current':
                return `from-${color}-500 to-${color}-600`;
            default:
                return 'from-gray-400 to-gray-500';
        }
    };

    const getStatusBadge = () => {
        switch (status) {
            case 'completed':
                return (
                    <Badge className="bg-green-500 text-white">
                        <Check className="w-3 h-3 mr-1" />
                        Completed
                    </Badge>
                );
            case 'current':
                return <Badge className={`bg-${color}-500 text-white`}>In Progress</Badge>;
            default:
                return <Badge variant="outline">Pending</Badge>;
        }
    };

    return (
        <Card className={`transition-all duration-300 ${
            status === 'current' ? 'ring-2 ring-blue-500 shadow-xl' : ''
        } ${status === 'pending' ? 'opacity-60' : ''}`}>
            <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => status !== 'pending' && setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getStatusColor()} flex items-center justify-center flex-shrink-0`}>
                        {status === 'completed' ? (
                            <Check className="w-6 h-6 text-white" />
                        ) : (
                            <span className="text-white font-bold text-lg">{stepNumber}</span>
                        )}
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <CardTitle className="text-xl">{title}</CardTitle>
                            {getStatusBadge()}
                        </div>
                        <p className="text-sm text-gray-600">{description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {Icon && <Icon className="w-5 h-5 text-gray-400" />}
                        {status !== 'pending' && (
                            isExpanded ? 
                                <ChevronDown className="w-5 h-5 text-gray-400" /> : 
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                    </div>
                </div>
            </CardHeader>

            {isExpanded && status !== 'pending' && (
                <CardContent className="pt-0 space-y-4">
                    {children}

                    {models && models.length > 0 && status === 'current' && (
                        <ModelSelector
                            models={models}
                            selectedModelId={selectedModelId}
                            onSelect={onModelSelect}
                            label={`Select ${title} Model`}
                            disabled={isProcessing}
                        />
                    )}

                    {status === 'current' && onProceed && (
                        <div className="pt-4 border-t border-gray-200">
                            <Button
                                onClick={onProceed}
                                disabled={!canProceed || isProcessing}
                                className={`w-full ${
                                    canProceed && !isProcessing
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                                        : 'bg-gray-300 text-gray-700 cursor-not-allowed'
                                }`}
                                size="lg"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        {processingButtonText}
                                    </>
                                ) : (
                                    <>
                                        {proceedButtonText}
                                        <ChevronRight className="w-5 h-5 ml-2" />
                                    </>
                                )}
                            </Button>
                            {!canProceed && !isProcessing && (
                                <p className="text-xs text-amber-600 mt-2 text-center">
                                    Please complete all required selections above before proceeding
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
}
