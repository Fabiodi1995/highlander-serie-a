import React, { useState } from 'react';
import { Calendar, Clock, Save, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DeadlineSetterProps {
  isOpen: boolean;
  onClose: () => void;
  onSetDeadline: (deadline: string) => void;
  currentDeadline?: string | null;
  isLoading?: boolean;
}

export function DeadlineSetter({ 
  isOpen, 
  onClose, 
  onSetDeadline, 
  currentDeadline,
  isLoading = false 
}: DeadlineSetterProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      // Initialize with current deadline if exists, otherwise 2 hours from now in Italian timezone
      const now = new Date();
      const italianTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Rome"}));
      const defaultDeadline = currentDeadline ? 
        new Date(currentDeadline) : 
        new Date(italianTime.getTime() + 2 * 60 * 60 * 1000);
      
      // Format for Italian timezone
      const italianDeadline = new Date(defaultDeadline.toLocaleString("en-US", {timeZone: "Europe/Rome"}));
      const dateStr = italianDeadline.toISOString().split('T')[0];
      const timeStr = italianDeadline.toTimeString().slice(0, 5);
      
      setSelectedDate(dateStr);
      setSelectedTime(timeStr);
      setError('');
    }
  }, [isOpen, currentDeadline]);

  const validateDateTime = () => {
    if (!selectedDate || !selectedTime) {
      setError('Data e ora sono obbligatorie');
      return false;
    }

    // Crea la data considerando il timezone italiano
    const selectedDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
    const now = new Date();
    const italianNow = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Rome"}));

    // Verifica che la data sia nel futuro (timezone italiano)
    if (selectedDateTime <= italianNow) {
      setError('La deadline deve essere nel futuro (orario italiano)');
      return false;
    }

    // Verifica che non sia troppo nel futuro
    const maxDate = new Date(italianNow.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 giorni
    if (selectedDateTime > maxDate) {
      setError('La deadline non può essere oltre 30 giorni nel futuro');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = () => {
    if (!validateDateTime()) return;

    const deadlineISO = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();
    onSetDeadline(deadlineISO);
  };

  const getPreviewMessage = () => {
    if (!selectedDate || !selectedTime) return '';
    
    const selectedDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
    const now = new Date();
    const diffMs = selectedDateTime.getTime() - now.getTime();
    
    if (diffMs <= 0) return '';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    let timeFromNow = '';
    if (diffHours > 0) {
      timeFromNow = `${diffHours}h ${diffMinutes}min`;
    } else {
      timeFromNow = `${diffMinutes} minuti`;
    }
    
    return `Scadenza: ${selectedDateTime.toLocaleString('it-IT')} (tra ${timeFromNow})`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {currentDeadline ? 'Modifica Deadline' : 'Imposta Deadline'}
          </DialogTitle>
          <DialogDescription>
            Imposta la scadenza per le selezioni del round corrente.
            {currentDeadline && ' Puoi modificare la deadline anche se ci sono già selezioni effettuate.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Data
            </Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Ora
            </Label>
            <Input
              id="time"
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          {getPreviewMessage() && !error && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-3">
                <div className="text-sm text-blue-700">
                  <strong>Anteprima:</strong> {getPreviewMessage()}
                </div>
              </CardContent>
            </Card>
          )}

          {currentDeadline && (
            <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-md">
              <strong>Deadline attuale:</strong> {new Date(currentDeadline).toLocaleString('it-IT')}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Annulla
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !!error || !selectedDate || !selectedTime}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Salvando...' : currentDeadline ? 'Aggiorna' : 'Imposta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}