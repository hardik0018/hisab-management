'use client'

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ShieldCheck, Zap, Globe, LucideIcon } from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const [, setIsHovered] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl: '/dashboard' });
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="relative">
          <img src="/logo.png" alt="Logo" className="h-24 w-24 object-contain animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white">
      {/* Left Side - Visuals */}
      <div className="hidden lg:flex flex-1 bg-slate-900 relative overflow-hidden items-center justify-center p-12">
         {/* Animated Background Elements */}
         <div className="absolute inset-0 opacity-20">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600 rounded-full blur-[120px] animate-pulse delay-700" />
         </div>
         
         <div className="relative z-10 space-y-8 max-w-lg">
            <div 
               
               className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-bold border border-white/10 backdrop-blur-md"
            >
               <Sparkles className="h-4 w-4 text-yellow-400" />
               Join 10,000+ users worldwide
            </div>
            
            <h1 
               
               className="text-6xl font-black text-white leading-tight"
            >
               Master your <span className="text-primary italic">Hisab</span> with precision.
            </h1>
            
            <p 
               
               className="text-xl text-slate-400 leading-relaxed"
            >
               The all-in-one financial toolkit for modern households. Track expenses, manage credit, and social gifts in one place.
            </p>
            
            <div 
               
               className="grid grid-cols-2 gap-6 pt-8"
            >
               <Feature icon={ShieldCheck} text="Secure Bank-Grade Encryption" />
               <Feature icon={Zap} text="Real-time Synchronization" />
               <Feature icon={Globe} text="Cloud-based Accessibility" />
               <Feature icon={Sparkles} text="Intelligent Data Analysis" />
            </div>
         </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 lg:bg-white">
        <div 
           
           className="w-full max-w-md space-y-8"
        >
          <div className="text-center lg:text-left space-y-2">
            <div className="lg:hidden mx-auto w-24 h-24 flex items-center justify-center mb-6">
               <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h2>
            <p className="text-slate-500 font-medium">Log in to your account to continue.</p>
          </div>

          <div className="space-y-4">
            <button
               onClick={handleGoogleLogin}
               onMouseEnter={() => setIsHovered(true)}
               onMouseLeave={() => setIsHovered(false)}
               className="w-full group relative flex items-center justify-center h-14 bg-slate-900 text-white rounded-2xl font-bold text-lg overflow-hidden transition-all hover:shadow-2xl hover:shadow-primary/30"
            >
               <div 
                  className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-100 transition-opacity"
                  
               />
               <div className="relative z-10 flex items-center gap-3">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
               </div>
            </button>
            
            <p className="text-xs text-center text-slate-400 font-medium pt-4">
              By continuing, you agree to our <span className="underline cursor-pointer hover:text-primary">Terms of Service</span> and <span className="underline cursor-pointer hover:text-primary">Privacy Policy</span>.
            </p>
          </div>

          <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
             <p className="text-sm font-bold text-slate-800">New here?</p>
             <button className="text-primary font-bold text-sm hover:underline">Create an account</button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FeatureProps {
    icon: LucideIcon;
    text: string;
}

function Feature({ icon: Icon, text }: FeatureProps) {
   return (
      <div className="flex items-center gap-3">
         <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
         </div>
         <span className="text-sm font-semibold text-slate-300">{text}</span>
      </div>
   );
}
