import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Film, LogOut, Menu, X, Music, HelpCircle, Home as HomeIcon, Shield, BarChart3, FolderKanban } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout({ children, currentPageName }) {
    const [user, setUser] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);
        } catch (err) {
            console.log('User not logged in');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await base44.auth.logout();
        window.location.href = createPageUrl('LandingPage');
    };

    const isLandingPage = currentPageName === 'LandingPage';
    const isPaymentPage = currentPageName === 'PaymentSuccess' || currentPageName === 'PaymentCancel';
    const isAdminPage = currentPageName?.startsWith('Admin');

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (isLandingPage || isPaymentPage) {
        return <div>{children}</div>;
    }

    // Dark theme for admin pages
    if (isAdminPage) {
        return (
            <div className="min-h-screen bg-slate-950">
                <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between h-16">
                            <Link
                                to={createPageUrl('Home')}
                                className="flex items-center gap-2 text-xl font-bold text-white hover:text-blue-400 transition-colors"
                            >
                                <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg">
                                    <Film className="w-6 h-6 text-white" />
                                </div>
                                <span>Cuts & Flow</span>
                            </Link>

                            <div className="flex items-center gap-6">
                                <Link
                                    to={createPageUrl('AdminDashboard')}
                                    className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-2"
                                >
                                    <Shield className="w-4 h-4" />
                                    Admin Dashboard
                                </Link>

                                {user && (
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-slate-400">
                                            {user.full_name || user.email}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleLogout}
                                            className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                                        >
                                            <LogOut className="w-4 h-4 mr-2" />
                                            Logout
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </nav>
                <div>{children}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <Link
                            to={createPageUrl('Home')}
                            className="flex items-center gap-2 text-xl font-bold hover:opacity-80 transition-opacity"
                        >
                            <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg">
                                <Film className="w-6 h-6 text-white" />
                            </div>
                            <span className="hidden sm:inline bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                                Cuts & Flow
                            </span>
                        </Link>

                        <div className="hidden md:flex items-center gap-6">
                            <Link
                                to={createPageUrl('Home')}
                                className={`text-sm font-medium transition-colors flex items-center gap-2 ${currentPageName === 'Home'
                                        ? 'text-amber-600'
                                        : 'text-gray-600 hover:text-amber-600'
                                    }`}
                            >
                                <HomeIcon className="w-4 h-4" />
                                Create
                            </Link>

                            <Link
                                to={createPageUrl('Templates')}
                                className={`text-sm font-medium transition-colors flex items-center gap-2 ${currentPageName === 'Templates'
                                        ? 'text-purple-600'
                                        : 'text-gray-600 hover:text-purple-600'
                                    }`}
                            >
                                <FolderKanban className="w-4 h-4" />
                                Templates
                            </Link>

                            <Link
                                to={createPageUrl('MusicLibrary')}
                                className={`text-sm font-medium transition-colors flex items-center gap-2 ${currentPageName === 'MusicLibrary'
                                        ? 'text-indigo-600'
                                        : 'text-gray-600 hover:text-indigo-600'
                                    }`}
                            >
                                <Music className="w-4 h-4" />
                                Music
                            </Link>

                            <Link
                                to={createPageUrl('Analytics')}
                                className={`text-sm font-medium transition-colors flex items-center gap-2 ${currentPageName === 'Analytics'
                                        ? 'text-teal-600'
                                        : 'text-gray-600 hover:text-teal-600'
                                    }`}
                            >
                                <BarChart3 className="w-4 h-4" />
                                Analytics
                            </Link>

                            <Link
                                to={createPageUrl('VideoEditor')}
                                className={`text-sm font-medium transition-colors flex items-center gap-2 ${currentPageName === 'VideoEditor'
                                        ? 'text-purple-600'
                                        : 'text-gray-600 hover:text-purple-600'
                                    }`}
                            >
                                <Film className="w-4 h-4" />
                                Editor
                            </Link>

                            <Link
                                to={createPageUrl('Help')}
                                className={`text-sm font-medium transition-colors flex items-center gap-2 ${currentPageName === 'Help'
                                        ? 'text-blue-600'
                                        : 'text-gray-600 hover:text-blue-600'
                                    }`}
                            >
                                <HelpCircle className="w-4 h-4" />
                                Help
                            </Link>

                            {user && user.role === 'admin' && (
                                <Link
                                    to={createPageUrl('AdminDashboard')}
                                    className={`text-sm font-medium transition-colors flex items-center gap-2 ${currentPageName?.startsWith('Admin')
                                            ? 'text-red-600'
                                            : 'text-gray-600 hover:text-red-600'
                                        }`}
                                >
                                    <Shield className="w-4 h-4" />
                                    Admin
                                </Link>
                            )}

                            {user ? (
                                <div className="flex items-center gap-4">
                                    {user.plan_type && user.plan_type !== 'free' && (
                                        <span className="px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold rounded-full">
                                            {user.plan_type.toUpperCase()}
                                        </span>
                                    )}
                                    <span className="text-sm text-gray-600">
                                        {user.full_name || user.email}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleLogout}
                                        className="flex items-center gap-2"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => base44.auth.login()}
                                >
                                    Login
                                </Button>
                            )}
                        </div>

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 text-gray-600 hover:text-amber-600"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>

                    <AnimatePresence>
                        {mobileMenuOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="md:hidden border-t border-gray-200 overflow-hidden"
                            >
                                <div className="py-4 space-y-3">
                                    <Link
                                        to={createPageUrl('Home')}
                                        className={`block px-4 py-2 text-sm font-medium flex items-center gap-2 ${currentPageName === 'Home'
                                                ? 'text-amber-600 bg-amber-50'
                                                : 'text-gray-600'
                                            }`}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <HomeIcon className="w-4 h-4" />
                                        Create Video
                                    </Link>

                                    <Link
                                        to={createPageUrl('Templates')}
                                        className={`block px-4 py-2 text-sm font-medium flex items-center gap-2 ${currentPageName === 'Templates'
                                                ? 'text-purple-600 bg-purple-50'
                                                : 'text-gray-600'
                                            }`}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <FolderKanban className="w-4 h-4" />
                                        Templates
                                    </Link>

                                    <Link
                                        to={createPageUrl('MusicLibrary')}
                                        className={`block px-4 py-2 text-sm font-medium flex items-center gap-2 ${currentPageName === 'MusicLibrary'
                                                ? 'text-indigo-600 bg-indigo-50'
                                                : 'text-gray-600'
                                            }`}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <Music className="w-4 h-4" />
                                        Music
                                    </Link>

                                    <Link
                                        to={createPageUrl('Analytics')}
                                        className={`block px-4 py-2 text-sm font-medium flex items-center gap-2 ${currentPageName === 'Analytics'
                                                ? 'text-teal-600 bg-teal-50'
                                                : 'text-gray-600'
                                            }`}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <BarChart3 className="w-4 h-4" />
                                        Analytics
                                    </Link>

                                    <Link
                                        to={createPageUrl('VideoEditor')}
                                        className={`block px-4 py-2 text-sm font-medium flex items-center gap-2 ${currentPageName === 'VideoEditor'
                                                ? 'text-purple-600 bg-purple-50'
                                                : 'text-gray-600'
                                            }`}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <Film className="w-4 h-4" />
                                        Video Editor
                                    </Link>

                                    <Link
                                        to={createPageUrl('Help')}
                                        className={`block px-4 py-2 text-sm font-medium flex items-center gap-2 ${currentPageName === 'Help'
                                                ? 'text-blue-600 bg-blue-50'
                                                : 'text-gray-600'
                                            }`}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <HelpCircle className="w-4 h-4" />
                                        Help
                                    </Link>

                                    {user && user.role === 'admin' && (
                                        <Link
                                            to={createPageUrl('AdminDashboard')}
                                            className={`block px-4 py-2 text-sm font-medium flex items-center gap-2 ${currentPageName?.startsWith('Admin')
                                                    ? 'text-red-600 bg-red-50'
                                                    : 'text-gray-600'
                                                }`}
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            <Shield className="w-4 h-4" />
                                            Admin Panel
                                        </Link>
                                    )}

                                    {user ? (
                                        <>
                                            <div className="px-4 py-2 text-sm text-gray-600">
                                                {user.full_name || user.email}
                                                {user.plan_type && user.plan_type !== 'free' && (
                                                    <span className="ml-2 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold rounded">
                                                        {user.plan_type.toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    handleLogout();
                                                    setMobileMenuOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-600 flex items-center gap-2"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Logout
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                base44.auth.login();
                                                setMobileMenuOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-600"
                                        >
                                            Login
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </nav>

            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}