/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminDashboard from './pages/AdminDashboard';
import AdminGlobalSettings from './pages/AdminGlobalSettings';
import AdminModelManagement from './pages/AdminModelManagement';
import AdminModelRegistry from './pages/AdminModelRegistry';
import AdminPrompts from './pages/AdminPrompts';
import AdminSystemMonitor from './pages/AdminSystemMonitor';
import AdminTierManagement from './pages/AdminTierManagement';
import AdminUserManagement from './pages/AdminUserManagement';
import Analytics from './pages/Analytics';
import AssetManager from './pages/AssetManager';
import BatchCreator from './pages/BatchCreator';
import BrandManager from './pages/BrandManager';
import Help from './pages/Help';
import Home from './pages/Home';
import LandingPage from './pages/LandingPage';
import MusicLibrary from './pages/MusicLibrary';
import PaymentCancel from './pages/PaymentCancel';
import PaymentSuccess from './pages/PaymentSuccess';
import Templates from './pages/Templates';
import VideoEditor from './pages/VideoEditor';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "AdminGlobalSettings": AdminGlobalSettings,
    "AdminModelManagement": AdminModelManagement,
    "AdminModelRegistry": AdminModelRegistry,
    "AdminPrompts": AdminPrompts,
    "AdminSystemMonitor": AdminSystemMonitor,
    "AdminTierManagement": AdminTierManagement,
    "AdminUserManagement": AdminUserManagement,
    "Analytics": Analytics,
    "AssetManager": AssetManager,
    "BatchCreator": BatchCreator,
    "BrandManager": BrandManager,
    "Help": Help,
    "Home": Home,
    "LandingPage": LandingPage,
    "MusicLibrary": MusicLibrary,
    "PaymentCancel": PaymentCancel,
    "PaymentSuccess": PaymentSuccess,
    "Templates": Templates,
    "VideoEditor": VideoEditor,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};