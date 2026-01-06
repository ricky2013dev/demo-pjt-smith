import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import LoginModal from '@/components/LoginModal';
import mermaid from 'mermaid';

const HomePage: React.FC = () => {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [loginUserType, setLoginUserType] = useState<'b2b' | 'insurance' | 'admin'>('b2b');
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

    const handleLoginClick = (userType: 'b2b' | 'insurance' | 'admin' = 'b2b') => {
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
                onLoginClick={() => handleLoginClick('b2b')}
                onInsuranceLoginClick={() => handleLoginClick('insurance')}
                onAdminLoginClick={() => handleLoginClick('admin')}
            />

            {/* Desktop Warning Toast */}
            {showDesktopWarning && (
                <div className="fixed inset-x-4 top-20 md:left-1/2 md:transform md:-translate-x-1/2 z-50 animate-fade-in md:w-auto">
                    <div className="bg-red-600 text-white px-4 py-5 md:px-6 md:py-4 rounded-xl shadow-2xl md:max-w-md mx-auto">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-3xl md:text-2xl flex-shrink-0">error</span>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-lg md:text-lg mb-2">Mobile Not Supported</h3>
                                <p className="text-sm md:text-sm leading-relaxed">This application is not available on mobile devices. Please access from a tablet or desktop computer.</p>
                            </div>
                            <button
                                onClick={() => setShowDesktopWarning(false)}
                                className="text-white hover:text-red-200 transition-colors flex-shrink-0 p-1 -mr-1 -mt-1"
                                aria-label="Close"
                            >
                                <span className="material-symbols-outlined text-2xl">close</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="flex-grow flex flex-col items-center justify-center px-6 relative overflow-hidden">
                {/* Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-orange-200/20 dark:bg-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
                    <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-blue-200/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '1s' }}></div>
                </div>

                <div className="max-w-4xl w-full z-10 text-center space-y-8">

                    {/* Hero Section */}
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-1 px-1 py-0 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30 text-orange-600 dark:text-orange-400 text-xs font-medium uppercase tracking-wider mb-4">
                            <span className="w-2 h-1 rounded-full bg-orange-500 animate-pulse"></span>
                            Next Gen Automation
                        </div>

                        <h1 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-slate-400">
                                Multimodal Intelligence
                            </span>
                            <br />
                            <span className="text-2xl md:text-4xl text-slate-400 dark:text-slate-500 font-normal">
                                for Complex Workflows
                            </span>
                        </h1>
                    </div>

                    {/* Bridge Visualization - Smith AI Between Dental Office & Insurance */}
                    <div className="relative py-8 px-8 overflow-hidden">
                        {/* Content */}
                        <div className="relative z-10">


                            <div className="flex items-center justify-center gap-6 flex-wrap md:gap-8">
                                {/* Dental Office */}
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl blur-lg opacity-25 group-hover:opacity-40 transition-opacity"></div>
                                        <div className="relative w-20 h-20 rounded-2xl bg-white dark:bg-slate-700 shadow-lg border border-blue-200 dark:border-blue-800/50 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-3xl text-blue-600 dark:text-blue-400">local_pharmacy</span>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-slate-900 dark:text-white text-sm">Dental Office</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Workflow & Data</p>
                                    </div>
                                </div>

                                {/* Left Connection Lines */}
                                <div className="hidden md:flex items-center justify-center relative flex-1 h-32">
                                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 120" preserveAspectRatio="xMidYMid meet">
                                        {/* Forward line - left to center top */}
                                        <path
                                            d="M 10 40 Q 40 20 95 50"
                                            stroke="url(#blueGradient)"
                                            strokeWidth="2"
                                            fill="none"
                                            strokeLinecap="round"
                                            className="animate-pulse"
                                        />
                                        {/* Arrow forward */}
                                        <path d="M 85 48 L 97 50 L 85 52" stroke="url(#blueGradient)" strokeWidth="1.5" fill="none" strokeLinecap="round" />

                                        {/* Return line - center bottom to left */}
                                        <path
                                            d="M 95 70 Q 40 100 10 80"
                                            stroke="url(#purpleGradient)"
                                            strokeWidth="2"
                                            fill="none"
                                            strokeLinecap="round"
                                            className="animate-pulse"
                                            style={{ animationDelay: '0.6s' }}
                                        />
                                        {/* Arrow return */}
                                        <path d="M 15 82 L 3 80 L 15 78" stroke="url(#purpleGradient)" strokeWidth="1.5" fill="none" strokeLinecap="round" />

                                        <defs>
                                            <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="rgb(59, 130, 246)" />
                                                <stop offset="100%" stopColor="rgb(59, 130, 246, 0.8)" />
                                            </linearGradient>
                                            <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="rgb(168, 85, 247)" />
                                                <stop offset="100%" stopColor="rgb(168, 85, 247, 0.8)" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                </div>

                                {/* AI/Robotics Connection Bridge - Central Hub */}
                                <div className="flex items-center justify-center flex-1 relative">
                                    {/* Central AI/Robotics Hub */}
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="relative group">
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity animate-pulse" style={{ animationDuration: '2.5s' }}></div>
                                            <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg flex items-center justify-center">
                                                <span className="material-symbols-outlined text-xl text-white">smart_toy</span>
                                            </div>
                                        </div>
                                        <p className="font-bold text-xs uppercase tracking-wide text-center mt-1">
                                            <span className="text-orange-600 dark:text-orange-500">Smith</span>
                                            <span className="text-slate-900 dark:text-white"> AI</span>
                                        </p>
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/30 mt-1">
                                            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">100% Automation</span>
                                        </div>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 text-center">Bidirectional<br/>Integration</p>
                                    </div>
                                </div>

                                {/* Right Connection Lines */}
                                <div className="hidden md:flex items-center justify-center relative flex-1 h-32">
                                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 120" preserveAspectRatio="xMidYMid meet">
                                        {/* Forward line - center top to right */}
                                        <path
                                            d="M 5 50 Q 60 20 90 40"
                                            stroke="url(#orangeGradient)"
                                            strokeWidth="2"
                                            fill="none"
                                            strokeLinecap="round"
                                            className="animate-pulse"
                                            style={{ animationDelay: '0.3s' }}
                                        />
                                        {/* Arrow forward */}
                                        <path d="M 80 38 L 92 40 L 80 42" stroke="url(#orangeGradient)" strokeWidth="1.5" fill="none" strokeLinecap="round" />

                                        {/* Return line - right to center bottom */}
                                        <path
                                            d="M 90 80 Q 60 100 5 70"
                                            stroke="url(#greenGradient)"
                                            strokeWidth="2"
                                            fill="none"
                                            strokeLinecap="round"
                                            className="animate-pulse"
                                            style={{ animationDelay: '0.6s' }}
                                        />
                                        {/* Arrow return */}
                                        <path d="M 10 72 L -2 70 L 10 68" stroke="url(#greenGradient)" strokeWidth="1.5" fill="none" strokeLinecap="round" />

                                        <defs>
                                            <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="rgb(249, 115, 22)" />
                                                <stop offset="100%" stopColor="rgb(249, 115, 22, 0.8)" />
                                            </linearGradient>
                                            <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="rgb(34, 197, 94)" />
                                                <stop offset="100%" stopColor="rgb(34, 197, 94, 0.8)" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                </div>

                                {/* Mobile Connection Indicator */}
                                <div className="md:hidden flex flex-col items-center gap-3 my-4">
                                    <div className="flex gap-2">
                                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-bounce" style={{ animationDelay: '0s' }}></div>
                                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-orange-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-green-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                                        <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg flex items-center justify-center">
                                            <span className="material-symbols-outlined text-lg text-white">smart_toy</span>
                                        </div>
                                    </div>
                                    <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">AI & Robotics Bridge</p>
                                </div>

                                {/* Insurance Company */}
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl blur-lg opacity-25 group-hover:opacity-40 transition-opacity"></div>
                                        <div className="relative w-20 h-20 rounded-2xl bg-white dark:bg-slate-700 shadow-lg border border-green-200 dark:border-green-800/50 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-3xl text-green-600 dark:text-green-400">verified_user</span>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-slate-900 dark:text-white text-sm">Insurance Company</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Verification & Claims</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Mission Statement */}
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-blue-500 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                        <div className="relative bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8 rounded-xl shadow-sm">
                            <p className="text-lg md:text-2xl text-slate-600 dark:text-slate-300 leading-relaxed font-light">
                                Our mission is to solve the challenge of repetitive yet complex business tasks through <span className="text-slate-900 dark:text-white font-medium">multimodal intelligence</span>.
                                By combining <span className="text-slate-900 dark:text-white font-medium">document analysis</span> with <span className="text-slate-900 dark:text-white font-medium">autonomous voice AI</span>,
                                we decipher intricate operational workflows and interrogate live sources to bridge data gaps, providing a complete,
                                crystalline view of transactional status and providing <span className="text-orange-600 dark:text-orange-500 font-semibold">100% end-to-end automation</span>.
                            </p>
                        </div>
                    </div>

                    {/* CTA / Visual Indicator - Formula Style - Clickable */}
                    <div
                        onClick={() => setShowDiagramModal(true)}
                        className="pt-4 flex justify-center items-center gap-4 flex-wrap cursor-pointer group/workflow hover:scale-105 transition-transform duration-300"
                        title="Click to view detailed workflow diagram"
                    >
                        <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 to-orange-500/10 rounded-3xl opacity-0 group-hover/workflow:opacity-100 transition-opacity duration-300 blur-xl"></div>

 


                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-md border border-slate-100 dark:border-slate-700 flex items-center justify-center text-blue-500">
                               <span className="material-symbols-outlined">description</span>
                            </div>
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Document Analysis AI</span>
                        </div>

                        <div className="text-3xl font-bold text-slate-400 dark:text-slate-600 mt-[-2rem]">
                              <span className="material-symbols-outlined"> add</span>
                        </div>

                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-md border border-slate-100 dark:border-slate-700 flex items-center justify-center text-blue-500">
                                <span className="material-symbols-outlined">graphic_eq</span>
                            </div>
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Autonomous Voice AI</span>
                        </div>

                       <div className="text-3xl font-bold text-slate-400 dark:text-slate-600 mt-[-2rem]"> 
                           
                             <span className="material-symbols-outlined"> Keyboard_Double_Arrow_Right</span>
                        </div>
               <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/20 flex items-center justify-center text-white">
                                <span className="material-symbols-outlined">auto_awesome</span>
                            </div>
                            <span className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wide">Multimodal Intelligence</span>
                        </div>
                    </div>



                </div>
            </main>

            <footer className="py-6 text-center text-slate-400 dark:text-slate-600 text-sm">
                © {new Date().getFullYear()} Smith AI Center. All rights reserved.
            </footer>

            <LoginModal isOpen={isLoginModalOpen} onClose={handleCloseLoginModal} userType={loginUserType} />

            {/* Workflow Diagram Modal */}
            {showDiagramModal && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setShowDiagramModal(false)}
                >
                    <div
                        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-5xl max-h-[90vh] overflow-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    Smart AI Workflow
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    Detailed sequence diagram of the verification process
                                </p>
                            </div>
                            <button
                                onClick={() => setShowDiagramModal(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2"
                            >
                                <span className="material-symbols-outlined text-3xl">close</span>
                            </button>
                        </div>

                        {/* Mermaid Diagram Content */}
                        <div className="p-8">
                            <div className="relative bg-slate-50 dark:bg-slate-800/50 rounded-xl p-8">
                                <pre className="mermaid text-center">
{`sequenceDiagram
    participant PMS
    participant SMITH as Smith AI Center
    participant INS as Insurance Company

    Note over PMS, INS: Smith AI end-to-end automation workflow

    PMS->>SMITH: Pull Patient schedule Data



    rect rgb(240, 240, 240)
        Note right of SMITH: API Interface
        SMITH->>INS: API Call
        INS-->>SMITH: Data
    end

    rect rgb(240, 240, 240)
        Note right of SMITH: AI Call
        SMITH->>INS: AI Call
        INS-->>SMITH: Voice call
    end

    SMITH-->>PMS: Send back To PMS
`}
                                </pre>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                            <button
                                onClick={() => setShowDiagramModal(false)}
                                className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePage;
