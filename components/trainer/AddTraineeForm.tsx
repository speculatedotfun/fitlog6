"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, X, MessageSquare, Copy, Check } from "lucide-react";

interface AddTraineeFormProps {
  onAdd: (email: string, password: string, name: string) => Promise<void>;
  onCancel: () => void;
  adding: boolean;
  error: string | null;
}

export function AddTraineeForm({ onAdd, onCancel, adding, error }: AddTraineeFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    if (!name || !email || !password) {
      return;
    }
    await onAdd(email, password, name);
    // Clear form on success
    if (!error) {
      setName("");
      setEmail("");
      setPassword("");
    }
  };

  const handleWhatsAppShare = (email: string, password: string) => {
    const message = `שלום! נוצר עבורך חשבון ב-Universal FitLog.\n\nפרטי התחברות:\nאימייל: ${email}\nסיסמה: ${password}\n\nמומלץ לשנות את הסיסמה בכניסה הראשונה.\n\nכניסה: ${window.location.origin}/auth/login`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleCopyCredentials = (email: string, password: string) => {
    const text = `אימייל: ${email}\nסיסמה: ${password}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Card className="bg-[#1a2332] border-2 border-[#00ff88]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">הוסף מתאמן חדש</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="text-gray-400 hover:text-white"
            disabled={adding}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-800 rounded-md text-red-300 text-sm">
            {error}
          </div>
        )}
        
        <div>
          <label className="text-sm font-medium mb-2 block text-gray-300">
            שם המתאמן
          </label>
          <Input
            type="text"
            placeholder="הזן שם"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-[#0f1a2a] border-gray-700 text-white"
            disabled={adding}
          />
        </div>
        
        <div>
          <label className="text-sm font-medium mb-2 block text-gray-300">
            אימייל (שם משתמש)
          </label>
          <Input
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-[#0f1a2a] border-gray-700 text-white"
            disabled={adding}
          />
        </div>
        
        <div>
          <label className="text-sm font-medium mb-2 block text-gray-300">
            סיסמה ראשונית
          </label>
          <Input
            type="password"
            placeholder="לפחות 6 תווים"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-[#0f1a2a] border-gray-700 text-white"
            disabled={adding}
          />
          <p className="text-xs text-gray-500 mt-1">
            ⚠️ זוהי סיסמה ראשונית. מומלץ שהמתאמן ישנה אותה בכניסה הראשונה.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!name || !email || !password || adding}
            className="flex-1 bg-[#00ff88] hover:bg-[#00e677] text-black font-semibold"
          >
            {adding ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                מוסיף...
              </>
            ) : (
              "הוסף מתאמן"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
            disabled={adding}
          >
            ביטול
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Component to display credentials after successful creation
interface CredentialsDisplayProps {
  email: string;
  password: string;
  onClose: () => void;
}

export function CredentialsDisplay({ email, password, onClose }: CredentialsDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleWhatsAppShare = () => {
    const message = `שלום! נוצר עבורך חשבון ב-Universal FitLog.\n\nפרטי התחברות:\nאימייל: ${email}\nסיסמה: ${password}\n\nמומלץ לשנות את הסיסמה בכניסה הראשונה.\n\nכניסה: ${window.location.origin}/auth/login`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleCopyCredentials = () => {
    const text = `אימייל: ${email}\nסיסמה: ${password}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Card className="bg-[#1a2332] border-2 border-[#00ff88] mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">פרטי התחברות למתאמן החדש</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-[#0f1a2a] rounded-md border border-gray-700">
          <p className="text-sm text-gray-400 mb-2">אימייל:</p>
          <p className="text-white font-mono text-lg">{email}</p>
          <p className="text-sm text-gray-400 mb-2 mt-4">סיסמה:</p>
          <p className="text-white font-mono text-lg">{password}</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleWhatsAppShare}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            <MessageSquare className="h-4 w-4 ml-2" />
            שלח בוואטסאפ
          </Button>
          <Button
            onClick={handleCopyCredentials}
            variant="outline"
            className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 ml-2" />
                הועתק!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 ml-2" />
                העתק
              </>
            )}
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 text-center">
          ⚠️ שמור את הפרטים במקום בטוח. המתאמן יוכל לשנות את הסיסמה בכניסה הראשונה.
        </p>
      </CardContent>
    </Card>
  );
}

