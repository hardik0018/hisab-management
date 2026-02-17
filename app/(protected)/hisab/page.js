'use client'

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Search, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ConfirmDialog';

export default function HisabPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'debit',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await fetch('/api/hisab', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecords(data.records || []);
      }
    } catch (error) {
      console.error('Failed to fetch records:', error);
      toast.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingRecord 
        ? `/api/hisab/${editingRecord.hisab_id}`
        : '/api/hisab';
      
      const method = editingRecord ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        toast.success(editingRecord ? 'Record updated!' : 'Record added!');
        setShowDialog(false);
        resetForm();
        fetchRecords();
      } else {
        toast.error('Failed to save record');
      }
    } catch (error) {
      console.error('Failed to save record:', error);
      toast.error('Failed to save record');
    }
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;
    
    try {
      const response = await fetch(`/api/hisab/${recordToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (response.ok) {
        toast.success('Record deleted!');
        fetchRecords();
      } else {
        toast.error('Failed to delete record');
      }
    } catch (error) {
      console.error('Failed to delete record:', error);
      toast.error('Failed to delete record');
    } finally {
      setRecordToDelete(null);
    }
  };

  const confirmDelete = (recordId) => {
    setRecordToDelete(recordId);
    setShowDeleteConfirm(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      name: record.name,
      type: record.type,
      amount: record.amount.toString(),
      description: record.description || '',
      date: new Date(record.date).toISOString().split('T')[0],
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setEditingRecord(null);
    setFormData({
      name: '',
      type: 'debit',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const filteredRecords = records.filter(record => 
    record.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDebit = filteredRecords.filter(r => r.type === 'debit').reduce((sum, r) => sum + r.amount, 0);
  const totalCredit = filteredRecords.filter(r => r.type === 'credit').reduce((sum, r) => sum + r.amount, 0);
  const balance = totalCredit - totalDebit;

  // Group by person
  const groupedByPerson = filteredRecords.reduce((acc, record) => {
    if (!acc[record.name]) {
      acc[record.name] = { debit: 0, credit: 0, records: [] };
    }
    if (record.type === 'debit') {
      acc[record.name].debit += record.amount;
    } else {
      acc[record.name].credit += record.amount;
    }
    acc[record.name].records.push(record);
    return acc;
  }, {});

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Debit-Credit Hisab</h1>
          <p className="text-gray-600">Manage your debit and credit records</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Debit</p>
                <p className="text-3xl font-bold mt-1">₹{totalDebit.toFixed(2)}</p>
              </div>
              <TrendingDown className="h-10 w-10 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Credit</p>
                <p className="text-3xl font-bold mt-1">₹{totalCredit.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-10 w-10 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-r ${balance >= 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'} text-white`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Balance</p>
                <p className="text-3xl font-bold mt-1">₹{balance.toFixed(2)}</p>
              </div>
              {balance >= 0 ? <TrendingUp className="h-10 w-10 opacity-80" /> : <TrendingDown className="h-10 w-10 opacity-80" />}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Person-wise Summary */}
      {Object.keys(groupedByPerson).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">Person-wise Hisab</h2>
          {Object.entries(groupedByPerson).map(([name, data]) => {
            const personBalance = data.credit - data.debit;
            return (
              <Card key={name} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{name}</h3>
                      <div className="flex gap-4 mt-1 text-sm">
                        <span className="text-orange-600">Debit: ₹{data.debit.toFixed(2)}</span>
                        <span className="text-blue-600">Credit: ₹{data.credit.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Balance</p>
                      <p className={`text-xl font-bold ${personBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{personBalance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* All Records */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-900">All Records</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : filteredRecords.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">No records found</p>
              <Button onClick={() => setShowDialog(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add First Record
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredRecords.map((record) => (
              <Card key={record.hisab_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{record.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded capitalize font-medium ${record.type === 'credit' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                          {record.type}
                        </span>
                      </div>
                      {record.description && (
                        <p className="text-sm text-gray-600 mt-1">{record.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(record.date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <p className={`text-xl font-bold ${record.type === 'credit' ? 'text-blue-600' : 'text-orange-600'}`}>
                        {record.type === 'credit' ? '+' : '-'}₹{record.amount.toFixed(2)}
                      </p>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(record)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => confirmDelete(record.hisab_id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <Button
        onClick={() => {
          resetForm();
          setShowDialog(true);
        }}
        className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 z-40"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRecord ? 'Edit Record' : 'Add Hisab Record'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Person's name"
              />
            </div>
            
            <div>
              <Label htmlFor="type">Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debit">Debit (Given)</SelectItem>
                  <SelectItem value="credit">Credit (Received)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="amount">Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add any notes..."
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingRecord ? 'Update' : 'Add'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title="Delete Record"
        description="Are you sure you want to delete this record? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}