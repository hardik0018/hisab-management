'use client';

import { Component } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, RefreshCcw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <Card className="max-w-md w-full border-none shadow-2xl rounded-[2rem] overflow-hidden">
            <div className="bg-red-500 p-8 flex justify-center">
              <AlertCircle className="h-16 w-16 text-white animate-pulse" />
            </div>
            <CardContent className="p-8 text-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900">Something went wrong</h2>
                <p className="text-slate-500 font-medium">
                  An unexpected error occurred. Don't worry, your data is safe.
                </p>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-2xl text-left overflow-hidden">
                <p className="text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">Error Trace</p>
                <p className="text-xs font-mono text-red-600 line-clamp-2">
                  {this.state.error?.message || 'Unknown Error'}
                </p>
              </div>

              <Button 
                onClick={() => window.location.reload()}
                className="w-full h-12 rounded-xl bg-slate-900 font-bold"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Reload Application
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
