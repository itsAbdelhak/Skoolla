import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { EyeIcon, EyeOffIcon, MailIcon, LockIcon } from '../icons';

interface AuthFormProps {
  type: 'login' | 'signup';
}

const InputField: React.FC<{
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
  children?: React.ReactNode;
  icon: React.ReactNode;
}> = ({ id, type, value, onChange, placeholder, required, children, icon }) => (
  <div>
      <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
            {icon}
          </span>
          <input
              id={id}
              name={id}
              type={type}
              autoComplete={id}
              required={required}
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              className="block w-full appearance-none rounded-xl border-2 border-slate-200 bg-slate-50/50 px-3.5 py-3 pl-11 text-slate-900 placeholder-slate-500 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm transition-colors"
          />
          {children}
      </div>
  </div>
);

export const AuthForm: React.FC<AuthFormProps> = ({ type }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (type === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else if (data.user && data.user.identities && data.user.identities.length === 0) {
        setMessage({ type: 'error', text: 'This user already exists. Please try logging in.' });
      } else if (data.user) {
        setMessage({ type: 'success', text: 'Success! Please check your email to confirm your account.' });
      }
    } else { // login
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setMessage({ type: 'error', text: error.message });
      }
    }

    setLoading(false);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {type === 'signup' && (
        <InputField
          id="full_name"
          label="Full Name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Jane Doe"
          required
          icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.99 5.99 0 00-4.793 2.39A6.483 6.483 0 0010 16.5a6.483 6.483 0 004.793-2.11A5.99 5.99 0 0010 12z" clipRule="evenodd" /></svg>}
        />
      )}
      <InputField
        id="email"
        label="Email Address"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        icon={<MailIcon className="h-5 w-5" />}
      />
      <div>
        <InputField
            id="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            icon={<LockIcon className="h-5 w-5" />}
        >
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
                {showPassword ? (
                    <EyeOffIcon className="h-5 w-5" />
                ) : (
                    <EyeIcon className="h-5 w-5" />
                )}
            </button>
        </InputField>
         <div className="text-right mt-1.5">
            <a href="#" className="text-xs font-semibold text-slate-500 hover:text-primary transition-colors">
                Forgot password?
            </a>
        </div>
      </div>
      
      {message && (
        <div className={`text-sm p-3 rounded-xl ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message.text}
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="appearance-none flex w-full justify-center rounded-xl bg-slate-900 py-3 px-4 text-sm font-semibold text-white shadow-md transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            type === 'login' ? 'Sign In' : 'Create Account'
          )}
        </button>
      </div>
    </form>
  );
};