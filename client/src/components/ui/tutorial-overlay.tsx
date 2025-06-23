import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { X, ArrowRight, ArrowLeft, Play, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    type: 'click' | 'hover' | 'input';
    element: string;
  };
}

interface TutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  steps: TutorialStep[];
  onComplete: () => void;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Benvenuto in Highlander!',
    content: 'Questo è il gioco di eliminazione basato sui risultati della Serie A. Ti guideremo attraverso le funzionalità principali.',
    target: 'body',
    position: 'center'
  },
  {
    id: 'dashboard',
    title: 'Dashboard Principale',
    content: 'Qui puoi vedere i tuoi giochi attivi, le statistiche e le ultime notizie. È il tuo centro di controllo.',
    target: '[data-tutorial="dashboard"]',
    position: 'bottom'
  },
  {
    id: 'games',
    title: 'I Tuoi Giochi',
    content: 'Visualizza tutti i giochi a cui partecipi. Clicca su un gioco per entrare e fare le tue selezioni.',
    target: '[data-tutorial="games-list"]',
    position: 'top'
  },
  {
    id: 'analytics',
    title: 'Analytics Avanzata',
    content: 'Analizza le tue performance con grafici dettagliati, confronti e consigli AI personalizzati.',
    target: '[data-tutorial="analytics-nav"]',
    position: 'top'
  },
  {
    id: 'notifications',
    title: 'Notifiche Push',
    content: 'Ricevi avvisi per scadenze, risultati e achievement. Clicca sulla campana per gestire le impostazioni.',
    target: '[data-tutorial="notifications"]',
    position: 'bottom'
  },
  {
    id: 'profile',
    title: 'Il Tuo Profilo',
    content: 'Gestisci i tuoi dati, visualizza achievement e statistiche personali. Personalizza la tua esperienza.',
    target: '[data-tutorial="profile-nav"]',
    position: 'top'
  }
];

export function TutorialOverlay({ isOpen, onClose, steps = TUTORIAL_STEPS, onComplete }: TutorialOverlayProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (isOpen && steps.length > 0) {
      highlightElement(steps[currentStep].target);
    }
    
    return () => {
      removeHighlight();
    };
  }, [isOpen, currentStep, steps]);

  const highlightElement = (selector: string) => {
    removeHighlight();
    
    if (selector === 'body') return;
    
    const element = document.querySelector(selector);
    if (element) {
      element.classList.add('tutorial-highlight');
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const removeHighlight = () => {
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeeTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTutorial = () => {
    setIsCompleted(true);
    localStorage.setItem('highlander_tutorial_completed', 'true');
    removeHighlight();
    onClose();
  };

  const completeeTutorial = () => {
    setIsCompleted(true);
    localStorage.setItem('highlander_tutorial_completed', 'true');
    removeHighlight();
    onComplete();
    onClose();
  };

  if (!isOpen || isCompleted) return null;

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
      
      {/* Tutorial Card */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-white dark:bg-gray-800 shadow-2xl">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Play className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    {currentStepData.title}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    Passo {currentStep + 1} di {steps.length}
                  </Badge>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={skipTutorial}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <Progress value={progress} className="h-2 mb-2" />
              <p className="text-xs text-gray-500 text-center">
                Progresso del tutorial
              </p>
            </div>

            {/* Content */}
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {currentStepData.content}
              </p>
            </div>

            {/* Action Hint */}
            {currentStepData.action && (
              <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Suggerimento:</strong> Prova a {currentStepData.action.type === 'click' ? 'cliccare' : 'interagire'} con l'elemento evidenziato
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Indietro
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={skipTutorial}
                  className="text-gray-500"
                >
                  Salta
                </Button>
                
                <Button
                  onClick={nextStep}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                >
                  {currentStep === steps.length - 1 ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Completa
                    </>
                  ) : (
                    <>
                      Avanti
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// Tutorial Manager Hook
export function useTutorial() {
  const { user } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (user) {
      const hasCompletedTutorial = localStorage.getItem('highlander_tutorial_completed');
      const isFirstTime = !localStorage.getItem('highlander_user_visited');
      
      if (!hasCompletedTutorial && isFirstTime) {
        // Show tutorial after a brief delay for first-time users
        setTimeout(() => {
          setShowTutorial(true);
        }, 2000);
        
        localStorage.setItem('highlander_user_visited', 'true');
      }
    }
  }, [user]);

  const startTutorial = () => {
    setShowTutorial(true);
  };

  const closeTutorial = () => {
    setShowTutorial(false);
  };

  const completeTutorial = () => {
    // Track tutorial completion
    if (user) {
      fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'tutorial_completed',
          properties: {
            userId: user.id,
            timestamp: new Date().toISOString()
          }
        })
      }).catch(console.error);
    }
  };

  return {
    showTutorial,
    startTutorial,
    closeTutorial,
    completeTutorial
  };
}