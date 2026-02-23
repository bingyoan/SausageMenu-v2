import React, { useState, useEffect } from 'react';
import { X, Percent, Receipt, LogOut } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tax: number, service: number) => void;
  currentTax: number;
  currentService: number;
  onResetApp?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentTax,
  currentService,
  onResetApp
}) => {
  const [taxRate, setTaxRate] = useState(currentTax.toString());
  const [serviceRate, setServiceRate] = useState(currentService.toString());

  useEffect(() => {
    setTaxRate(currentTax.toString());
    setServiceRate(currentService.toString());
  }, [currentTax, currentService, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="bg-sausage-900 px-6 py-4 flex justify-between items-center">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Receipt size={20} className="text-sausage-300" />
            App Settings
          </h3>
          <button onClick={onClose} className="text-sausage-200 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Pricing Logic Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sausage-800 font-bold text-sm">
              <Receipt size={16} /> Price Estimation Settings
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500">Tax Rate (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="w-full p-2 pl-3 pr-8 bg-gray-50 border-2 border-gray-200 rounded-lg focus:border-sausage-500 focus:outline-none"
                  />
                  <Percent size={14} className="absolute right-3 top-3 text-gray-400" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500">Service Fee (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={serviceRate}
                    onChange={(e) => setServiceRate(e.target.value)}
                    className="w-full p-2 pl-3 pr-8 bg-gray-50 border-2 border-gray-200 rounded-lg focus:border-sausage-500 focus:outline-none"
                  />
                  <Percent size={14} className="absolute right-3 top-3 text-gray-400" />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 leading-tight">
              These rates will be applied to the base price to estimate the final bill (e.g. +10% service charge).
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => {
                onSave(Number(taxRate) || 0, Number(serviceRate) || 0);
                onClose();
              }}
              className="w-full py-3 bg-sausage-600 hover:bg-sausage-700 text-white rounded-xl font-bold shadow-md transition-transform active:scale-95"
            >
              Save Settings
            </button>

            {onResetApp && (
              <button
                onClick={() => {
                  if (confirm('登出帳號並回到語言選擇畫面？\nLog out and return to language selection?')) {
                    onResetApp();
                  }
                }}
                className="w-full py-3 text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <LogOut size={16} /> 登出帳號 / Log Out
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};