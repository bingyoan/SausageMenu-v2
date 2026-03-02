import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ETIQUETTE_TIPS } from '../constants';
import { GeoLocation, TargetLanguage } from '../types';

interface MenuProcessingProps {
  scanLocation?: GeoLocation;
  targetLang: TargetLanguage;
  currentPage?: number;
  totalPages?: number;
  itemsFound?: number;
}

const STEPS = [
  "Compressing images...",
  "Uploading to AI...",
  "Analyzing menu structure...",
  "Applying Strict OCR...",
  "Translating tasty treats...",
  "Detecting allergens...",
  "Finalizing details..."
];

export const MenuProcessing: React.FC<MenuProcessingProps> = ({ scanLocation, targetLang, currentPage, totalPages, itemsFound }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % ETIQUETTE_TIPS.length);
    }, 5000);
    return () => clearInterval(tipInterval);
  }, []);

  const currentTip = ETIQUETTE_TIPS[tipIndex];

  useEffect(() => {
    const intervals = [1000, 1500, 3000, 2000, 2000, 1500, 2000];
    let stepIndex = 0;
    const advanceStep = () => {
      if (stepIndex < STEPS.length - 1) {
        stepIndex++;
        setCurrentStep(stepIndex);
        setTimeout(advanceStep, intervals[stepIndex] || 2000);
      }
    };
    const initialTimeout = setTimeout(advanceStep, intervals[0]);
    return () => clearTimeout(initialTimeout);
  }, []);

  const displayContent = currentTip.content[targetLang] || currentTip.content[TargetLanguage.English] || "Wait a moment...";

  const s = {
    bg: 'var(--bg-primary)',
    card: 'var(--glass-bg)',
    cardBorder: 'var(--glass-border)',
    text1: 'var(--text-primary)',
    text2: 'var(--text-secondary)',
    text3: 'var(--text-tertiary)',
    brand: 'var(--brand-primary)',
    brandGlow: 'var(--brand-glow)',
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 relative overflow-hidden"
      style={{ background: s.bg }}>

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div className="absolute rounded-full"
          style={{ width: 400, height: 400, top: '20%', left: '50%', marginLeft: -200, background: `radial-gradient(circle, ${s.brandGlow} 0%, transparent 70%)`, filter: 'blur(80px)' }}
          animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }} />
      </div>

      {/* Dog animation */}
      <div className="relative mb-8 z-10">
        <motion.div
          animate={{ y: [0, -8, 0, -5, 0], rotate: [-0.5, 1.5, -0.5, 1, -0.5] }}
          transition={{ repeat: Infinity, duration: 0.5, ease: 'easeInOut' }}>
          <img src="/dachshund-silhouette.png" alt="Loading" className="w-64 h-44 object-contain"
            style={{ filter: 'drop-shadow(0 0 30px rgba(255,107,43,0.3))' }} />
        </motion.div>
        <motion.div className="mx-auto rounded-full"
          style={{ width: 140, height: 10, marginTop: -6, background: 'rgba(255,107,43,0.15)', filter: 'blur(4px)' }}
          animate={{ scaleX: [1, 0.75, 1], opacity: [0.3, 0.1, 0.3] }}
          transition={{ repeat: Infinity, duration: 0.5, ease: 'easeInOut' }} />
      </div>

      {/* Tip Card */}
      <motion.div className="w-full max-w-sm rounded-2xl p-6 mb-8 text-center relative overflow-hidden z-10"
        style={{ background: s.card, border: `1px solid ${s.cardBorder}`, backdropFilter: 'blur(20px)', minHeight: 140 }}
        key={tipIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}>
        <div className="absolute top-0 left-0 w-full h-0.5" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,107,43,0.3), transparent)' }} />
        <p className="text-[10px] uppercase font-bold tracking-wider flex items-center justify-center gap-1.5 mb-3" style={{ color: s.text3 }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#1ed760' }} />
          Dining Etiquette: {currentTip.countryName}
        </p>
        <h3 className="text-lg font-extrabold mb-2" style={{ color: s.text1 }}>DID YOU KNOW?</h3>
        <div className="pt-2" style={{ borderTop: `1px dashed ${s.cardBorder}` }}>
          <p className="text-sm font-medium leading-relaxed" style={{ color: s.text2 }}>
            &ldquo;{displayContent}&rdquo;
          </p>
        </div>
      </motion.div>

      {/* Progress */}
      <div className="w-full max-w-xs space-y-3 z-10">
        {totalPages && totalPages > 1 ? (
          <>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div className="h-full rounded-full"
                style={{ background: 'var(--brand-gradient)' }}
                initial={{ width: "0%" }}
                animate={{ width: `${(((currentPage ?? 0) + 1) / totalPages) * 100}%` }}
                transition={{ duration: 0.5 }} />
            </div>
            <div className="text-center">
              <p className="font-bold text-base" style={{ color: s.text1 }}>
                📄 Processing page {(currentPage ?? 0) + 1} / {totalPages}
              </p>
              {(itemsFound ?? 0) > 0 && (
                <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className="text-sm mt-1" style={{ color: '#1ed760' }}>
                  ✅ {itemsFound} items found so far
                </motion.p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div className="h-full rounded-full"
                style={{ background: 'var(--brand-gradient)' }}
                initial={{ width: "0%" }}
                animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                transition={{ duration: 0.5 }} />
            </div>
            <div className="h-8 relative overflow-hidden text-center">
              {STEPS.map((step, index) => (
                index === currentStep && (
                  <motion.p key={step}
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                    className="absolute inset-0 w-full font-bold text-sm"
                    style={{ color: s.text2 }}>
                    {step}
                  </motion.p>
                )
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};