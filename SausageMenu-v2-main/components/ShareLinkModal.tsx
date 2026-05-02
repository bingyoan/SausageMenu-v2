import React, { useState } from 'react';
import { X, Copy, Check, Link2, Clock, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { MenuData } from '../types';
import toast from 'react-hot-toast';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuData: MenuData;
  targetLanguage: string;
}

export const ShareLinkModal: React.FC<ShareLinkModalProps> = ({
  isOpen,
  onClose,
  menuData,
  targetLanguage,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [hostName, setHostName] = useState('');

  const handleGenerate = async () => {
    if (!hostName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    setIsGenerating(true);

    try {
      const res = await fetch('/api/share-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostName: hostName.trim(),
          menuData,
          targetLanguage,
          originalCurrency: menuData.originalCurrency,
          targetCurrency: menuData.targetCurrency,
          exchangeRate: menuData.exchangeRate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const baseUrl = window.location.origin;
        setShareLink(`${baseUrl}/share/${data.sessionId}`);
        // Save session ID so OrderSummary can fetch guest orders
        localStorage.setItem('current_share_session_id', data.sessionId);
      } else {
        toast.error(data.error || 'Failed to create session');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
    setIsGenerating(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success('✅ Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = shareLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      toast.success('✅ Link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setShareLink('');
    setCopied(false);
    setHostName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-5 text-white relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Users size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black">Share Menu</h2>
              <p className="text-white/80 text-xs">Let friends order from their phones</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {!shareLink ? (
            <>
              {/* Host Name Input */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Your Name (Table Host)</label>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder="e.g. David"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-bold focus:border-orange-400 focus:outline-none transition-colors"
                  autoFocus
                />
              </div>

              {/* Info */}
              <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                <div className="flex items-center gap-2 text-xs text-orange-700">
                  <Clock size={14} />
                  <span className="font-bold">Link expires in 1 hour</span>
                </div>
                <p className="text-xs text-orange-600 mt-1">
                  {menuData.items.length} dishes • {menuData.restaurantName || 'Menu'} • {menuData.originalCurrency}→{menuData.targetCurrency}
                </p>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !hostName.trim()}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-orange-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Link2 size={20} /> Generate Link
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Generated Link */}
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Share this link</p>
                <p className="text-sm text-gray-700 font-mono break-all select-all">{shareLink}</p>
              </div>

              <button
                onClick={handleCopy}
                className={`w-full py-3.5 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                  copied
                    ? 'bg-green-500 text-white shadow-lg shadow-green-200'
                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-200'
                }`}
              >
                {copied ? <><Check size={20} /> Copied!</> : <><Copy size={20} /> Copy Link</>}
              </button>

              <p className="text-center text-xs text-gray-400">
                Send this link to your friends via Line, WhatsApp, etc.<br />
                Their orders will appear in your <strong>Checkout Summary</strong>.
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
