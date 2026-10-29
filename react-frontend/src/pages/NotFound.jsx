import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-sm space-y-6 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200/80 text-orange-600 flex items-center justify-center mx-auto shadow-inner">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">404</span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Page Not Found
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
            Aap jis page ko dhoondh rahe hain vo uplabdh nahi hai ya use temporary disable kar diya gaya hai.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/login"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-600/20 transition active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Login</span>
          </Link>
        </div>

        <div className="border-t border-slate-100 pt-4 text-[11px] text-slate-400 font-medium">
          BachatKhata Pro • Error 404
        </div>
      </div>
    </div>
  );
}
