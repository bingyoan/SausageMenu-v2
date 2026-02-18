import React, { useEffect, useState, useMemo } from 'react';
import { SausageDogLogo, BoneIcon } from './DachshundAssets';
import { motion } from 'framer-motion';
import { ETIQUETTE_TIPS } from '../constants';
import { GeoLocation, TargetLanguage } from '../types';

interface MenuProcessingProps {
  scanLocation?: GeoLocation;
  targetLang: TargetLanguage;
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

export const MenuProcessing: React.FC<MenuProcessingProps> = ({ scanLocation, targetLang }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  // Rotate through ALL tips every 5 seconds
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

    return () => {
      clearTimeout(initialTimeout);
    };
  }, []);

  // Determine which language to show for the content
  const displayContent = currentTip.content[targetLang] || currentTip.content[TargetLanguage.English] || "Wait a moment...";

  return (
    <div className="flex flex-col items-center justify-center h-full bg-sausage-50 p-8 relative">
      <div className="relative mb-8">
        {/* 背景速度線 — 營造奔跑感 */}
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={`line-${i}`}
            className="absolute rounded-full bg-sausage-300/40"
            style={{
              width: 20 + i * 8,
              height: 2,
              top: 18 + i * 12,
              right: -10,
            }}
            animate={{
              x: [60, -200],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 0.8,
              delay: i * 0.15,
              ease: 'linear',
            }}
          />
        ))}

        {/* 走路的臘腸狗 */}
        <div className="relative z-10">
          <motion.div
            animate={{
              y: [0, -8, 0, -5, 0],
              rotate: [-0.5, 1.5, -0.5, 1, -0.5],
              x: [-2, 2, -2, 1, -2],
            }}
            transition={{
              repeat: Infinity,
              duration: 0.5,
              ease: 'easeInOut',
            }}
          >
            <img
              src="/dachshund-silhouette.png"
              alt="Loading"
              className="w-80 h-56 object-contain"
            />
          </motion.div>

          {/* 腳下陰影 */}
          <motion.div
            className="mx-auto rounded-full bg-black/10"
            style={{ width: 160, height: 12, marginTop: -8 }}
            animate={{
              scaleX: [1, 0.75, 1, 0.8, 1],
              opacity: [0.25, 0.1, 0.25, 0.12, 0.25],
            }}
            transition={{
              repeat: Infinity,
              duration: 0.5,
              ease: 'easeInOut',
            }}
          />
        </div>

        {/* 身後揚起的灰塵 */}
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={`dust-${i}`}
            className="absolute rounded-full bg-sausage-300/30"
            style={{
              width: 6 + i * 2,
              height: 6 + i * 2,
              bottom: 8,
              left: '15%',
            }}
            animate={{
              x: [0, -20 - i * 12],
              y: [0, -15 - i * 6, 5],
              opacity: [0.5, 0.3, 0],
              scale: [0.5, 1.2, 0.3],
            }}
            transition={{
              repeat: Infinity,
              duration: 1,
              delay: i * 0.25,
              ease: 'easeOut',
            }}
          />
        ))}

        {/* 腳印（左右交替） */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={`paw-${i}`}
            className="absolute text-sausage-200"
            style={{
              bottom: i % 2 === 0 ? 2 : 6,
              left: `${18 - i * 3}%`,
              fontSize: 14,
            }}
            animate={{
              x: [0, -40 - i * 20],
              opacity: [0.6, 0.3, 0],
              rotate: [0, -15],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.8,
              delay: i * 0.6,
              ease: 'easeOut',
            }}
          >
            🐾
          </motion.div>
        ))}
      </div>

      {/* Feature 10: Dining Etiquette Tip Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-md border-2 border-sausage-100 mb-8 min-h-[160px] flex flex-col items-center justify-center text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-sausage-200"></div>
        <p className="text-[10px] uppercase font-bold text-gray-400 mb-3 tracking-wider flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          Dining Etiquette: {currentTip.countryName}
        </p>

        <div className="flex flex-col gap-2 w-full">
          <h3 className="text-xl font-black text-sausage-900 leading-snug">
            DID YOU KNOW?
          </h3>

          <div className="mt-2 pt-2 border-t border-dashed border-gray-100">
            <p className="text-md font-bold text-gray-700 leading-relaxed">
              "{displayContent}"
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <div className="h-2 bg-sausage-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-sausage-600"
            initial={{ width: "0%" }}
            animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="h-8 relative overflow-hidden text-center">
          {STEPS.map((step, index) => (
            index === currentStep && (
              <motion.p
                key={step}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="absolute inset-0 w-full text-sausage-800 font-bold text-lg"
              >
                {step}
              </motion.p>
            )
          ))}
        </div>
      </div>
    </div>
  );
};