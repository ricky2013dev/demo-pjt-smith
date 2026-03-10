import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import LoginModal from '@/components/LoginModal';
import mermaid from 'mermaid';

const HomePage: React.FC = () => {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [loginUserType, setLoginUserType] = useState<'b2b' | 'admin'>('b2b');
    const [showDesktopWarning, setShowDesktopWarning] = useState(false);
    const [showDiagramModal, setShowDiagramModal] = useState(false);

    useEffect(() => {
        mermaid.initialize({
            startOnLoad: true,
            theme: 'default',
            securityLevel: 'loose',
        });
        mermaid.contentLoaded();
    }, []);

    useEffect(() => {
        if (showDiagramModal) {
            // Re-render mermaid diagram when modal opens
            setTimeout(() => {
                mermaid.contentLoaded();
            }, 100);
        }
    }, [showDiagramModal]);

    const handleLoginClick = (userType: 'b2b' | 'admin' = 'b2b') => {
        // Check if screen size is mobile (width < 768px) - allow tablets and desktop
        if (window.innerWidth < 768) {
            setShowDesktopWarning(true);
            setTimeout(() => setShowDesktopWarning(false), 5000); // Auto-hide after 5 seconds
            return;
        }
        setLoginUserType(userType);
        setIsLoginModalOpen(true);
    };

    const handleCloseLoginModal = () => {
        setIsLoginModalOpen(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col font-sans selection:bg-orange-100 dark:selection:bg-orange-900/30">
            <Header
             
            />



    

  

   

        </div>
    );
};

export default HomePage;
