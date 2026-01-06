import React, { useState, useEffect, useRef } from 'react';
import { Patient } from '@/types/patient';
import VerificationDataPanel, { VerificationDataRow } from './VerificationDataPanel';

interface SmithAICenterProps {
  patient: Patient;
  onClose: () => void;
}

interface ConversationMessage {
  speaker: 'AI Agent' | 'Insurance Rep' | 'System';
  text: string;
  time: string;
  isTyping?: boolean;
}

const SmithAICenter: React.FC<SmithAICenterProps> = ({ patient, onClose }) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [messages, setMessages] = useState<ConversationMessage[]>([
    {
      speaker: 'System',
      text: `Hello! I'm Smith AI Assistant. I'm ready to help with insurance verification for ${patient.name.given.join(' ')} ${patient.name.family}. Start Call when you're ready.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [currentTypingMessage, setCurrentTypingMessage] = useState<string>('');
  const [currentSpeaker, setCurrentSpeaker] = useState<'AI Agent' | 'Insurance Rep' | 'System' | null>(null);
  const [verificationData, setVerificationData] = useState<VerificationDataRow[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const callIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(isListening);
  const isCallActiveRef = useRef(isCallActive);
  const [isCallCompleted, setIsCallCompleted] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'end' | 'close' | null>(null);
  const [, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [verificationTab, setVerificationTab] = useState<'missing' | 'verified'>('verified');
  const synth = window.speechSynthesis;

  // Sync refs with state
  useEffect(() => {
    isListeningRef.current = isListening;
    if (!isListening) {
      synth.cancel();
    }
  }, [isListening]);

  useEffect(() => {
    isCallActiveRef.current = isCallActive;
  }, [isCallActive]);

  // Initialize verification data with realistic mix of missing and verified items
  useEffect(() => {
    const initialData: VerificationDataRow[] = [
      // Verified fields - Plan Information (from API)
      { saiCode: "VF000001", refInsCode: "D001", category: "Plan Information", fieldName: "Plan Name", preStepValue: "Blue Cross Dental Plus", missing: "N", aiCallValue: "Blue Cross Dental Plus", verifiedBy: "API" },
      { saiCode: "VF000002", refInsCode: "D002", category: "Plan Information", fieldName: "Group Number", preStepValue: "GRP987654", missing: "N", aiCallValue: "GRP987654", verifiedBy: "API" },
      { saiCode: "VF000003", refInsCode: "D003", category: "Plan Information", fieldName: "Effective Date", preStepValue: "01/01/2024", missing: "N", aiCallValue: "01/01/2024", verifiedBy: "API" },
      { saiCode: "VF000004", refInsCode: "D004", category: "Plan Information", fieldName: "Carrier Name", preStepValue: "Blue Cross Blue Shield", missing: "N", aiCallValue: "Blue Cross Blue Shield", verifiedBy: "API" },
      { saiCode: "VF000005", refInsCode: "D005", category: "Plan Information", fieldName: "Member ID", preStepValue: "SUB123456789", missing: "N", aiCallValue: "SUB123456789", verifiedBy: "API" },

      // Verified fields - Deductible (from API)
      { saiCode: "VF000051", refInsCode: "D051", category: "Deductible", fieldName: "Annual Deductible Amount", preStepValue: "0", missing: "N", aiCallValue: "$0 - No Deductible", verifiedBy: "API" },
      { saiCode: "VF000052", refInsCode: "D052", category: "Deductible", fieldName: "Deductible Applies To", preStepValue: "Basic & Major", missing: "N", aiCallValue: "Basic & Major", verifiedBy: "API" },
      { saiCode: "VF000053", refInsCode: "D053", category: "Deductible", fieldName: "Family Deductible", preStepValue: "$0", missing: "N", aiCallValue: "$0", verifiedBy: "API" },

      // Verified fields - Preventative Coverage (from API)
      { saiCode: "VF000010", refInsCode: "D010", category: "Preventative Coverage", fieldName: "Annual Cleaning Benefit", preStepValue: "2 Cleanings", missing: "N", aiCallValue: "2 Cleanings per Year", verifiedBy: "API" },
      { saiCode: "VF000011", refInsCode: "D011", category: "Preventative Coverage", fieldName: "Annual Exams", preStepValue: "2 Exams", missing: "N", aiCallValue: "2 Exams per Year", verifiedBy: "API" },
      { saiCode: "VF000012", refInsCode: "D012", category: "Preventative Coverage", fieldName: "X-ray Coverage", preStepValue: "1 FMS per 5 years", missing: "N", aiCallValue: "1 Full Mouth Series per 5 years", verifiedBy: "API" },

      // Verified fields - Basic Coverage (from API)
      { saiCode: "VF000020", refInsCode: "D020", category: "Basic Coverage", fieldName: "Fillings Coverage", preStepValue: "80%", missing: "N", aiCallValue: "80%", verifiedBy: "API" },
      { saiCode: "VF000021", refInsCode: "D021", category: "Basic Coverage", fieldName: "Extractions Coverage", preStepValue: "80%", missing: "N", aiCallValue: "80%", verifiedBy: "API" },
      { saiCode: "VF000022", refInsCode: "D022", category: "Basic Coverage", fieldName: "Scaling & Root Planing", preStepValue: "80%", missing: "N", aiCallValue: "80%", verifiedBy: "API" },

      // Verified fields - Major Coverage (from API)
      { saiCode: "VF000030", refInsCode: "D030", category: "Major Coverage", fieldName: "Crowns Coverage", preStepValue: "50%", missing: "N", aiCallValue: "50%", verifiedBy: "API" },
      { saiCode: "VF000031", refInsCode: "D031", category: "Major Coverage", fieldName: "Bridges Coverage", preStepValue: "50%", missing: "N", aiCallValue: "50%", verifiedBy: "API" },
      { saiCode: "VF000032", refInsCode: "D032", category: "Major Coverage", fieldName: "Dentures Coverage", preStepValue: "50%", missing: "N", aiCallValue: "50%", verifiedBy: "API" },
      { saiCode: "VF000033", refInsCode: "D033", category: "Major Coverage", fieldName: "Root Canals Coverage", preStepValue: "50%", missing: "N", aiCallValue: "50%", verifiedBy: "API" },
      { saiCode: "VF000034", refInsCode: "D034", category: "Major Coverage", fieldName: "Implants Coverage", preStepValue: "Not Covered", missing: "N", aiCallValue: "Not Covered - Considered Cosmetic", verifiedBy: "API" },

      // Verified fields - Annual Maximums (from API)
      { saiCode: "VF000060", refInsCode: "D060", category: "Annual Maximum", fieldName: "Annual Maximum Benefit", preStepValue: "$1200", missing: "N", aiCallValue: "$1,200 per Year", verifiedBy: "API" },
      { saiCode: "VF000061", refInsCode: "D061", category: "Annual Maximum", fieldName: "Ortho Maximum", preStepValue: "Not Included", missing: "N", aiCallValue: "Not Included", verifiedBy: "API" },

      // Missing fields - To verify during call
      { saiCode: "VF000028", refInsCode: "D028", category: "Preventative Coverage", fieldName: "Prophylaxis/Exam Frequency", preStepValue: "", missing: "Y", aiCallValue: "", verifiedBy: "-" },
      { saiCode: "VF000029", refInsCode: "D029", category: "Preventative Coverage", fieldName: "Last FMS Date", preStepValue: "", missing: "Y", aiCallValue: "", verifiedBy: "-" },
      { saiCode: "VF000040", refInsCode: "D040", category: "Preventative Coverage", fieldName: "Eligible for FMS Now", preStepValue: "", missing: "Y", aiCallValue: "", verifiedBy: "-" },
      { saiCode: "VF000041", refInsCode: "D041", category: "Preventative Coverage", fieldName: "FMS Frequency (Years)", preStepValue: "", missing: "Y", aiCallValue: "", verifiedBy: "-" },
      { saiCode: "VF000042", refInsCode: "D042", category: "Preventative Coverage", fieldName: "Fluoride Varnish Frequency", preStepValue: "", missing: "Y", aiCallValue: "", verifiedBy: "-" },
      { saiCode: "VF000045", refInsCode: "D045", category: "Major Coverage", fieldName: "Major Waiting Period", preStepValue: "", missing: "Y", aiCallValue: "", verifiedBy: "-" },
      { saiCode: "VF000046", refInsCode: "D046", category: "Major Coverage", fieldName: "Major Services Effective Date", preStepValue: "", missing: "Y", aiCallValue: "", verifiedBy: "-" },
      { saiCode: "VF000070", refInsCode: "D070", category: "Coverage Limits", fieldName: "Frequency Limitations", preStepValue: "", missing: "Y", aiCallValue: "", verifiedBy: "-" },
    ];
    setVerificationData(initialData);

    // Load voices
    const loadVoices = () => {
      const availableVoices = synth.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();

    // Chrome loads voices asynchronously
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }

    // Cleanup speech on unmount
    return () => {
      synth.cancel();
      if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = null;
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentTypingMessage]);

  const getFullName = () => {
    const given = patient.name.given.join(' ');
    return `${given} ${patient.name.family}`.trim();
  };

  const getPhone = () => {
    return patient.telecom.find(t => t.system === 'phone')?.value || 'N/A';
  };

  const getEmail = () => {
    return patient.telecom.find(t => t.system === 'email')?.value || 'N/A';
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Highlight values in text (numbers, percentages, dates, etc.)
  const highlightValues = (text: string) => {
    // Pattern to match: numbers, percentages, dates, dollar amounts, phone numbers, IDs
    const pattern = /(\d{1,2}\/\d{1,2}\/\d{4}|\d+%|\$\d+|SUB\d+|\d+-month|\d+\s+months?|\d+\s+years?|80%|50%|100%|\d{3}-\d{3}-\d{4}|January|February|March|April|May|June|July|August|September|October|November|December|\d{1,2},?\s*\d{4})/gi;

    const parts = text.split(pattern);
    return parts.map((part, index) => {
      if (pattern.test(part)) {
        return (
          <span key={index} className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1 rounded font-semibold">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Cancellable wait helper
  const wait = (ms: number) => new Promise<void>((resolve, reject) => {
    if (!isCallActiveRef.current) {
      reject(new Error('CallEnded'));
      return;
    }
    setTimeout(() => {
      if (!isCallActiveRef.current) {
        reject(new Error('CallEnded'));
      } else {
        resolve();
      }
    }, ms);
  });

  const speakText = (text: string, speaker: 'AI Agent' | 'Insurance Rep' | 'System'): Promise<void> => {
    // Use ref to get current listening state inside async/closure
    if (!isListeningRef.current || speaker === 'System') return Promise.resolve();

    return new Promise((resolve) => {
      // Cancel any current speech to be safe, though we await previous ones
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // Fetch voices directly to ensure we have the latest loaded voices
      const currentVoices = synth.getVoices();

      // Try to select better, more human-like voices
      if (speaker === 'AI Agent') {
        // Prefer a female voice for AI - "Google US English" is usually good/natural
        const aiVoice = currentVoices.find(v =>
          v.name === 'Google US English' ||
          v.name.includes('Samantha') ||
          v.name.includes('Natural') ||
          v.name.includes('Female')
        );
        if (aiVoice) utterance.voice = aiVoice;
        utterance.pitch = 1.0; // Natural pitch
        utterance.rate = 0.9;  // Slightly slower for clarity
      } else {
        // Prefer a male voice for Rep
        const repVoice = currentVoices.find(v =>
          v.name === 'Google UK English Male' ||
          v.name.includes('Daniel') ||
          v.name.includes('Natural') ||
          v.name.includes('Male')
        );
        if (repVoice) utterance.voice = repVoice;
        utterance.pitch = 0.95; // Slightly lower pitch
        utterance.rate = 0.85;  // Slower for the rep
      }

      utterance.onend = () => {
        resolve();
      };

      utterance.onerror = () => {
        // Resolve anyway to not block the flow
        resolve();
      };

      synth.speak(utterance);
    });
  };

  // Simulate typing effect
  const typeMessage = async (speaker: 'AI Agent' | 'Insurance Rep' | 'System', fullText: string, delay: number = 30) => {
    if (!isCallActiveRef.current) throw new Error('CallEnded');

    // Set current speaker for visual indicator
    setCurrentSpeaker(speaker);

    let speechPromise = Promise.resolve();

    // Start speaking when typing starts
    // Use ref to check current state
    if (isListeningRef.current && speaker !== 'System') {
      speechPromise = speakText(fullText, speaker);
    }

    const typingPromise = new Promise<void>((resolve) => {
      let index = 0;
      const typingInterval = setInterval(() => {
        if (index <= fullText.length) {
          setCurrentTypingMessage(fullText.slice(0, index));
          index++;
        } else {
          clearInterval(typingInterval);
          setCurrentTypingMessage('');
          setCurrentSpeaker(null);
          setMessages(prev => [...prev, {
            speaker,
            text: fullText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
          resolve();
        }
      }, delay);
    });

    // Wait for BOTH the visual typing and the speech to finish before moving on
    // This ensures the conversation speed matches the speech speed
    await Promise.all([speechPromise, typingPromise]);
  };

  // Mark field as currently being checked
  const setFieldChecking = (saiCode: string, isChecking: boolean) => {
    setVerificationData(prev => prev.map(row => {
      if (row.saiCode === saiCode) {
        return { ...row, isChecking };
      }
      return { ...row, isChecking: false }; // Clear checking state from other rows
    }));
  };

  // Update verification data row
  const updateVerificationRow = (saiCode: string, value: string) => {
    setVerificationData(prev => prev.map(row => {
      if (row.saiCode === saiCode) {
        return {
          ...row,
          aiCallValue: value,
          verifiedBy: "CALL",
          missing: "N",
          isUpdating: true,
          isChecking: false
        };
      }
      return row;
    }));

    // Remove updating highlight after a moment
    setTimeout(() => {
      setVerificationData(prev => prev.map(row => {
        if (row.saiCode === saiCode) {
          return { ...row, isUpdating: false };
        }
        return row;
      }));
    }, 1500);
  };

  // Simulate AI conversation
  const simulateAIConversation = async () => {
    try {
      await wait(1000);

      // Initial connection
      await typeMessage('System', 'Connecting to Blue Cross Blue Shield...', 40);
      await wait(800);
      await typeMessage('System', 'Call connected. Starting verification...', 40);
      await wait(1000);

      // Conversation 1 - Prophylaxis frequency
      await typeMessage('AI Agent', 'Hello, this is Smith AI calling on behalf of our dental practice. I need to verify insurance benefits for a patient.', 25);
      await wait(1200);
      await typeMessage('Insurance Rep', 'Hello! I can help you with that. Please provide the member ID and date of birth.', 25);
      await wait(800);
      await typeMessage('AI Agent', 'Member ID is SUB123456789, date of birth is January 15, 1975.', 25);
      await wait(1500);
      await typeMessage('Insurance Rep', 'Thank you. I have the member information pulled up. What benefits would you like to verify?', 25);
      await wait(800);
      setFieldChecking('VF000028', true);
      await typeMessage('AI Agent', 'Can you confirm the prophylaxis and exam frequency covered under this plan?', 25);
      await wait(1200);
      await typeMessage('Insurance Rep', 'Yes, prophylaxis and exams are covered every 6 months under preventative care.', 25);
      updateVerificationRow('VF000028', 'Every 6 months');
      await wait(1000);

      // Conversation 2 - FMS details
      setFieldChecking('VF000029', true);
      await typeMessage('AI Agent', 'Great. Can you tell me the date of the last full mouth series of x-rays?', 25);
      await wait(1200);
      await typeMessage('Insurance Rep', 'Let me check... The last FMS was on March 15, 2023.', 25);
      updateVerificationRow('VF000029', '03/15/2023');
      await wait(800);
      setFieldChecking('VF000040', true);
      await typeMessage('AI Agent', 'Is the patient eligible for a full mouth series now?', 25);
      await wait(1000);
      await typeMessage('Insurance Rep', 'Yes, they are eligible now since it has been over 3 years.', 25);
      updateVerificationRow('VF000040', 'Yes');
      await wait(700);
      setFieldChecking('VF000041', true);
      await typeMessage('AI Agent', 'What is the FMS frequency requirement?', 25);
      await wait(800);
      await typeMessage('Insurance Rep', 'The plan allows one full mouth series every 3 years.', 25);
      updateVerificationRow('VF000041', '3');
      await wait(1000);

      // Conversation 3 - Fluoride coverage
      setFieldChecking('VF000042', true);
      await typeMessage('AI Agent', 'What about fluoride varnish treatment frequency?', 25);
      await wait(1000);
      await typeMessage('Insurance Rep', 'Fluoride varnish is covered every 6 months for patients under 18 years old.', 25);
      updateVerificationRow('VF000042', 'Every 6 months (under 18)');
      await wait(1200);

      // Conversation 4 - Frequency limitations
      setFieldChecking('VF000070', true);
      await typeMessage('AI Agent', 'Are there any other frequency limitations I should be aware of?', 25);
      await wait(1000);
      await typeMessage('Insurance Rep', 'The plan includes standard frequency limitations: 2 cleanings per year, 2 exams per year, and 1 FMS every 3 years.', 25);
      updateVerificationRow('VF000070', 'Standard: 2 cleanings/year, 2 exams/year, 1 FMS/3 years');
      await wait(1200);

      // Conversation 5 - Major waiting period
      setFieldChecking('VF000045', true);
      await typeMessage('AI Agent', 'Can you confirm the waiting period for major services?', 25);
      await wait(1000);
      await typeMessage('Insurance Rep', 'Yes, there is a 6-month waiting period for major services.', 25);
      updateVerificationRow('VF000045', '6 months');
      await wait(800);

      // Conversation 6 - Major services effective date
      setFieldChecking('VF000046', true);
      await typeMessage('AI Agent', 'When will major services be effective for this patient?', 25);
      await wait(1200);
      await typeMessage('Insurance Rep', 'Based on the enrollment date, major services will be effective July 1, 2024.', 25);
      updateVerificationRow('VF000046', '07/01/2024');
      await wait(1200);

      // Closing
      await typeMessage('AI Agent', 'Perfect. That covers all the information I needed. Thank you for your help!', 25);
      await wait(1000);
      await typeMessage('Insurance Rep', 'You\'re welcome! Is there anything else I can help you with today?', 25);
      await wait(800);
      await typeMessage('AI Agent', 'No, that\'s everything. Have a great day!', 25);
      await wait(1000);
      await typeMessage('System', 'Call completed successfully. All missing data has been verified and updated.', 40);
      endCall();
    } catch (error: any) {
      if (error.message === 'CallEnded') {
      } else {
      }
    }
  };

  const startCall = () => {
    setIsCallActive(true);
    isCallActiveRef.current = true; // Immediate update for the loop
    setIsCallCompleted(false);
    setCallDuration(0);
    setVerificationTab('missing');

    // Clear the welcome message to save space
    setMessages([]);

    // Start call duration counter
    callIntervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    // Start AI conversation simulation
    simulateAIConversation();
  };

  const endCall = () => {
    setIsCallActive(false);
    isCallActiveRef.current = false; // Immediate stop
    setIsCallCompleted(true);
    if (callIntervalRef.current) {
      clearInterval(callIntervalRef.current);
    }
    synth.cancel(); // Stop speaking
  };

  const handleEndCallClick = () => {
    setConfirmAction('end');
  };

  const handleCloseClick = () => {
    if (isCallActive) {
      setConfirmAction('close');
    } else {
      onClose();
    }
  };

  const confirmActionHandler = () => {
    if (confirmAction === 'end') {
      endCall();
    } else if (confirmAction === 'close') {
      endCall();
      onClose();
    }
    setConfirmAction(null);
  };

  const cancelActionHandler = () => {
    setConfirmAction(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-slate-700 dark:text-slate-300">smart_toy</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Smith AI Center</h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Interactive Insurance Assistant</p>
              </div>
            </div>

            {/* Call Controls - Moved to Header */}
            <div className="flex items-center gap-4 mr-4">
              <div className={`flex items-center gap-3 px-4 py-1.5 rounded-full border ${isCallCompleted
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}>
                {isCallActive ? (
                  <>
                    <div className="w-2 h-2 bg-status-green rounded-full animate-pulse"></div>
                    <div className="flex flex-col leading-none">
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Call Active</span>
                      <span className="text-sm font-mono font-semibold text-slate-900 dark:text-white">{formatDuration(callDuration)}</span>
                    </div>
                  </>
                ) : isCallCompleted ? (
                  <>
                    <span className="material-symbols-outlined text-status-green text-lg">check_circle</span>
                    <div className="flex flex-col leading-none">
                      <span className="text-[10px] font-medium text-green-600 dark:text-green-400 uppercase tracking-wider">Call Completed</span>
                      <span className="text-sm font-mono font-semibold text-slate-900 dark:text-white">Total: {formatDuration(callDuration)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Ready to Connect</span>
                  </>
                )}

                {/* Volume Toggle (only show when active or completed) */}
                {(isCallActive || isCallCompleted) && (
                  <>
                    <div className={`w-px h-4 mx-1 ${isCallCompleted ? 'bg-green-200 dark:bg-green-800' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                    <button
                      onClick={() => setIsListening(!isListening)}
                      className={`p-1 rounded-full transition-colors ${isListening
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30'
                        : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                        }`}
                      title={isListening ? "Mute conversation" : "Listen to conversation"}
                    >
                      <span className="material-symbols-outlined text-lg">
                        {isListening ? 'volume_up' : 'volume_off'}
                      </span>
                    </button>
                  </>
                )}
              </div>

              {/* Conversation Participants Diagram - In Header */}
              {(isCallActive || isCallCompleted) && (
                <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  {/* Agent AI */}
                  <div className="flex flex-col items-center gap-0.5">
                    <div className={`w-7 h-7 rounded-full border-2 bg-white dark:bg-slate-900 flex items-center justify-center transition-all ${
                      currentSpeaker === 'AI Agent'
                        ? 'border-blue-500 shadow-lg shadow-blue-500/50'
                        : 'border-blue-400'
                    }`}>
                      <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-sm">smart_toy</span>
                    </div>
                    <span className="text-[9px] font-semibold text-slate-600 dark:text-slate-400">Agent AI</span>
                  </div>

                  {/* Signal Waves with Phone Icon - Telecommunication Design */}
                  <div className="flex items-center gap-1 pb-3">
                    {/* Left Signal Waves - AI Speaking */}
                    <div className="flex items-center gap-0.5">
                      <span className={`w-1 h-3 rounded-full transition-all ${
                        currentSpeaker === 'AI Agent'
                          ? 'bg-blue-500 animate-pulse'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}></span>
                      <span className={`w-1 h-4 rounded-full transition-all ${
                        currentSpeaker === 'AI Agent'
                          ? 'bg-blue-500 animate-pulse'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}></span>
                      <span className={`w-1 h-5 rounded-full transition-all ${
                        currentSpeaker === 'AI Agent'
                          ? 'bg-blue-500 animate-pulse'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}></span>
                    </div>

                    {/* Phone Icon in the middle */}
                    <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-base mx-1">
                      phone_in_talk
                    </span>

                    {/* Right Signal Waves - Rep Speaking */}
                    <div className="flex items-center gap-0.5">
                      <span className={`w-1 h-5 rounded-full transition-all ${
                        currentSpeaker === 'Insurance Rep'
                          ? 'bg-slate-500 animate-pulse'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}></span>
                      <span className={`w-1 h-4 rounded-full transition-all ${
                        currentSpeaker === 'Insurance Rep'
                          ? 'bg-slate-500 animate-pulse'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}></span>
                      <span className={`w-1 h-3 rounded-full transition-all ${
                        currentSpeaker === 'Insurance Rep'
                          ? 'bg-slate-500 animate-pulse'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}></span>
                    </div>
                  </div>

                  {/* Insurance Representative */}
                  <div className="flex flex-col items-center gap-0.5">
                    <div className={`w-7 h-7 rounded-full border-2 bg-white dark:bg-slate-900 flex items-center justify-center transition-all ${
                      currentSpeaker === 'Insurance Rep'
                        ? 'border-slate-500 shadow-lg shadow-slate-500/50'
                        : 'border-slate-400'
                    }`}>
                      <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 text-sm">headset_mic</span>
                    </div>
                    <span className="text-[9px] font-semibold text-slate-600 dark:text-slate-400">Insurance</span>
                  </div>
                </div>
              )}

              {!isCallActive && !isCallCompleted && (
                <button
                  onClick={startCall}
                  className="bg-slate-900 dark:bg-white hover:bg-slate-700 dark:hover:bg-slate-100 text-white dark:text-slate-900 px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors shadow-sm relative animate-pulse ring-2 ring-slate-900 dark:ring-white ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-900"
                >
                  <span className="material-symbols-outlined text-lg">call</span>
                  Start Call
                </button>
              )}

              {isCallActive && (
                <button
                  onClick={handleEndCallClick}
                  className="bg-status-red hover:bg-status-red/90 text-white px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-lg">call_end</span>
                  End Call
                </button>
              )}
            </div>

            <button
              onClick={handleCloseClick}
              className="w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors text-slate-600 dark:text-slate-400"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Patient Info Card */}
        <div className="bg-slate-50 dark:bg-slate-800 px-6 py-2.5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between gap-6">
            {/* Patient Info - Single Line */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-lg text-slate-600 dark:text-slate-400">person</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-medium text-slate-900 dark:text-white">{getFullName()}</span>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <span>ID: {patient.id}</span>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <span>{calculateAge(patient.birthDate)} years</span>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <span>{getPhone()}</span>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <span>{getEmail()}</span>
              </div>
            </div>

            {/* Active Status */}
            <div className={`px-3 py-1 rounded-md text-xs font-medium ${patient.active ? 'bg-status-green/10 text-status-green' : 'bg-status-red/10 text-status-red'}`}>
              {patient.active ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - AI Chat */}
          <div className="flex-1 flex flex-col border-r border-slate-200 dark:border-slate-700">
            {/* Tab Buttons - Show when call completed */}
            {isCallCompleted && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setShowSummary(false)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    !showSummary
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Conversation
                </button>
                <button
                  onClick={() => setShowSummary(true)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    showSummary
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Show Call Summary
                </button>
              </div>
            )}

            {/* Chat Messages or Summary */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-800/50">
              {showSummary ? (
                /* Call Summary View */
                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Call Summary</h3>

                    {/* Call Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Call Duration</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatDuration(callDuration)}</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Fields Verified</div>
                        <div className="text-2xl font-bold text-status-green">{verificationData.filter(r => r.aiCallValue).length}/{verificationData.length}</div>
                      </div>
                    </div>

                    {/* Verified Fields List */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Verified Information</h4>
                      <div className="space-y-2">
                        {verificationData.filter(r => r.aiCallValue).map((row, idx) => (
                          <div key={idx} className="flex items-start justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-md">
                            <div className="flex-1">
                              <div className="text-xs font-medium text-slate-900 dark:text-white">{row.fieldName}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{row.saiCode}</div>
                            </div>
                            <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 ml-4">{row.aiCallValue}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Conversation Messages */
                <>
                  {messages.map((message, index) => (
                <div key={index} className="flex items-start gap-2">
                  {message.speaker !== 'System' && (
                    <div className="relative flex-shrink-0">
                      {/* User Icon */}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 ${
                        message.speaker === 'AI Agent'
                          ? 'bg-white dark:bg-slate-900 border-blue-500'
                          : 'bg-white dark:bg-slate-900 border-slate-400'
                      }`}>
                        <span className={`material-symbols-outlined text-base ${
                          message.speaker === 'AI Agent'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          {message.speaker === 'AI Agent' ? 'smart_toy' : 'headset_mic'}
                        </span>
                      </div>
                      {/* Phone Icon Badge */}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 ${
                        message.speaker === 'AI Agent'
                          ? 'bg-blue-600 dark:bg-blue-500'
                          : 'bg-slate-600 dark:bg-slate-500'
                      }`}>
                        <span className="material-symbols-outlined text-white text-[9px]">phone</span>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 space-y-1">
                    {message.speaker === 'System' ? (
                      <div className="bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-center py-2 px-4 rounded-md text-sm font-medium">
                        {highlightValues(message.text)}
                      </div>
                    ) : (
                      <>
                        <div className={`text-sm ${
                          message.speaker === 'AI Agent'
                            ? 'text-slate-900 dark:text-slate-100'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {highlightValues(message.text)}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">
                          {message.time}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {currentTypingMessage && currentSpeaker && currentSpeaker !== 'System' && (
                <div className="flex items-start gap-2">
                  <div className="relative flex-shrink-0">
                    {/* Pulsing circle indicator for active speaker */}
                    <div className={`absolute inset-0 w-12 h-12 -left-1.5 -top-1.5 rounded-full border-2 animate-ping ${
                      currentSpeaker === 'AI Agent'
                        ? 'border-blue-500'
                        : 'border-slate-500'
                    } opacity-60`}></div>

                    {/* User Icon */}
                    <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center border-2 ${
                      currentSpeaker === 'AI Agent'
                        ? 'bg-white dark:bg-slate-900 border-blue-500'
                        : 'bg-white dark:bg-slate-900 border-slate-400'
                    }`}>
                      <span className={`material-symbols-outlined text-base ${
                        currentSpeaker === 'AI Agent'
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        {currentSpeaker === 'AI Agent' ? 'smart_toy' : 'headset_mic'}
                      </span>
                    </div>

                    {/* Phone Icon Badge */}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 ${
                      currentSpeaker === 'AI Agent'
                        ? 'bg-blue-600 dark:bg-blue-500'
                        : 'bg-slate-600 dark:bg-slate-500'
                    } z-10 animate-pulse`}>
                      <span className="material-symbols-outlined text-white text-[9px]">phone</span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="text-slate-700 dark:text-slate-300 text-sm">
                      {currentTypingMessage}
                      <span className="inline-block w-1 h-4 bg-slate-400 dark:bg-slate-500 ml-0.5 animate-pulse"></span>
                    </div>
                  </div>
                </div>
              )}

                  {/* System message typing */}
                  {currentTypingMessage && currentSpeaker === 'System' && (
                    <div className="bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-center py-2 px-4 rounded-md text-sm font-medium">
                      {currentTypingMessage}
                      <span className="inline-block w-1 h-4 bg-green-500 ml-0.5 animate-pulse"></span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
          </div>

          {/* Right Panel - Verification Data (Always visible) */}
          <VerificationDataPanel
            data={verificationData}
            showTabs={true}
            title="Live Verification Data Updates"
            subtitle="Watching"
            activeTab={verificationTab}
            onTabChange={setVerificationTab}
          />
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700 transform scale-100 transition-all">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-2xl">warning</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {confirmAction === 'end' ? 'End Call?' : 'Close Window?'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Are you sure you want to {confirmAction === 'end' ? 'end the current call' : 'close this window'}? The conversation will be stopped.
                </p>
              </div>
              <div className="flex items-center gap-3 w-full mt-2">
                <button
                  onClick={cancelActionHandler}
                  className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmActionHandler}
                  className="flex-1 px-4 py-2 bg-status-red hover:bg-status-red/90 text-white rounded-md text-sm font-medium transition-colors"
                >
                  {confirmAction === 'end' ? 'End Call' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmithAICenter;
