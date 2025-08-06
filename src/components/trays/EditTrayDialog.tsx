import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTrayTransactions } from '@/hooks/useTrayTransactions';

interface TrayTransaction {
  id: string;
  tray_number: string;
  customer_id: string;
  weight: number;
  rate_per_kg: number;
  total_amount: number;
  paid_amount: number;
  number_of_trays: number;
  status: string;
  notes?: string;
}

interface EditTrayDialogProps {
  trayTransaction: TrayTransaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditTrayDialog: React.FC<EditTrayDialogProps> = ({
  trayTransaction,
  open,
  onOpenChange,
}) => {
  const { updateTrayTransaction } = useTrayTransactions();
  const [trayNumber, setTrayNumber] = useState(trayTransaction.tray_number);
  const [weight, setWeight] = useState(trayTransaction.weight.toString());
  const [ratePerKg, setRatePerKg] = useState(trayTransaction.rate_per_kg.toString());
  const [numberOfTrays, setNumberOfTrays] = useState(trayTransaction.number_of_trays.toString());
  const [status, setStatus] = useState(trayTransaction.status);
  const [notes, setNotes] = useState(trayTransaction.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trayNumber.trim() || !weight || !ratePerKg) return;

    setSaving(true);
    try {
      const weightNum = parseFloat(weight);
      const rateNum = parseFloat(ratePerKg);
      const totalAmount = weightNum * rateNum;

      await updateTrayTransaction(trayTransaction.id, {
        tray_number: trayNumber.trim(),
        weight: weightNum,
        rate_per_kg: rateNum,
        total_amount: totalAmount,
        number_of_trays: parseInt(numberOfTrays) || 1,
        status: status as any,
        notes: notes.trim() || undefined,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update tray transaction:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Tray Transaction</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-tray-number">Tray Number *</Label>
            <Input
              id="edit-tray-number"
              value={trayNumber}
              onChange={(e) => setTrayNumber(e.target.value)}
              placeholder="Tray number"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-weight">Weight (kg) *</Label>
              <Input
                id="edit-weight"
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Weight"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-rate">Rate per kg *</Label>
              <Input
                id="edit-rate"
                type="number"
                step="0.01"
                value={ratePerKg}
                onChange={(e) => setRatePerKg(e.target.value)}
                placeholder="Rate per kg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-number-of-trays">Number of Trays</Label>
              <Input
                id="edit-number-of-trays"
                type="number"
                min="1"
                value={numberOfTrays}
                onChange={(e) => setNumberOfTrays(e.target.value)}
                placeholder="Number of trays"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_use">In Use</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes"
              rows={3}
            />
          </div>

          {weight && ratePerKg && (
            <div className="bg-muted p-3 rounded-md">
              <p className="font-semibold">
                Total Amount: ₹{(parseFloat(weight) * parseFloat(ratePerKg)).toFixed(2)}
              </p>
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};