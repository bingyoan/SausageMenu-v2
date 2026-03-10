import React, { useState } from 'react';
import { ArrowLeft, Trash2, Calendar, ShoppingBag, MapPin, Receipt, Share2, X } from 'lucide-react';
import { HistoryRecord, CartItem } from '../types';
import { SausageDogLogo, PawPrint } from './DachshundAssets';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import { getTargetCurrency, LANGUAGE_OPTIONS } from '../constants';

interface HistoryPageProps {
    history: HistoryRecord[];
    onBack: () => void;
    onDelete: (id: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ history, onBack, onDelete }) => {
    const [selectedReceipt, setSelectedReceipt] = useState<HistoryRecord | null>(null);

    // Feature 2: Navigation using GPS
    const handleNavigate = (record: HistoryRecord) => {
        if (record.location && record.location.lat && record.location.lng) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${record.location.lat},${record.location.lng}`, '_blank');
        } else {
            const query = record.restaurantName || "Restaurant";
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
        }
    };

    const handleDownloadReceipt = async () => {
        const element = document.getElementById('history-receipt-view');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = `SausageReceipt_${Date.now()}.png`;
            link.click();
            toast.success("Receipt saved for IG Story!");
        } catch (e) {
            toast.error("Failed to generate receipt");
        }
    };

    const calculateFinalTotal = (record: HistoryRecord) => {
        const multiplier = 1 + ((record.taxRate || 0) + (record.serviceRate || 0)) / 100;
        return (record.totalOriginalPrice * multiplier);
    };

    // Helper to determine target currency for old records if not strictly saved, 
    // though we should probably infer it from context or just use a default.
    // In the real app, we might want to save `targetCurrency` in HistoryRecord.
    // For now, let's assume TWD/USD based on typical usage or just show original if unknown.
    // EDIT: We can't easily know the exchange rate at that time unless we saved it.
    // Assuming current implementation didn't save historical exchange rate in HistoryRecord strictly (interface shows totalOriginalPrice).
    // Limitation: We might not show accurate converted price for OLD history if rate wasn't saved.
    // However, looking at types.ts, HistoryRecord doesn't have exchangeRate. 
    // To fix this without breaking changes, we might skip conversion in history OR assuming a current rate (bad practice).
    // Let's stick to showing the UI structure, but if data is missing, handle gracefully.

    return (
        <div className="flex flex-col h-full relative overflow-hidden" style={{ background: 'var(--bg-primary)', transition: 'background 0.3s' }}>
            <div className="px-4 py-3 flex items-center gap-4 sticky top-0 z-20" style={{ background: 'var(--header-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--glass-border)', transition: 'background 0.3s' }}>
                <button onClick={onBack} className="p-2 rounded-full" style={{ color: 'var(--text-secondary)' }}>
                    <ArrowLeft size={24} />
                </button>
                <h2 className="font-extrabold text-xl" style={{ color: 'var(--text-primary)' }}>Order History</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-70">
                        <SausageDogLogo className="w-32 h-20 mb-4 grayscale opacity-30" />
                        <p className="font-bold" style={{ color: 'var(--text-muted)' }}>No orders yet!</p>
                    </div>
                ) : (
                    history.map((record) => (
                        <div key={record.id} className="rounded-2xl p-4 relative z-10" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--brand-primary)' }}>
                                    <Calendar size={14} />
                                    {new Date(record.timestamp).toLocaleDateString()}
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => onDelete(record.id)} className="p-2 rounded-full transition-colors" style={{ background: 'var(--danger-bg)', color: 'var(--danger-color)' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-between items-start">
                                <div>
                                    {record.restaurantName && (
                                        <h3 className="font-bold mb-2 truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }}>{record.restaurantName}</h3>
                                    )}
                                    {record.location && (
                                        <div className="flex items-center gap-1 text-[10px] mb-2" style={{ color: 'var(--text-muted)' }}>
                                            <MapPin size={10} />
                                            {record.location.lat.toFixed(4)}, {record.location.lng.toFixed(4)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1 mb-3">
                                {record.items.slice(0, 3).map((cartItem, idx) => (
                                    <div key={idx} className="flex justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                        <span className="truncate max-w-[70%]">{cartItem.item.originalName}</span>
                                        <span>x{cartItem.quantity}</span>
                                    </div>
                                ))}
                                {record.items.length > 3 && (
                                    <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>+ {record.items.length - 3} more items...</p>
                                )}
                            </div>

                            <div className="pt-3 flex justify-between items-center" style={{ borderTop: '1px dashed var(--glass-border)' }}>
                                <div>
                                    <div className="font-extrabold text-lg" style={{ color: 'var(--text-primary)' }}>
                                        {calculateFinalTotal(record).toFixed(0)} {record.currency}
                                    </div>
                                    {(record.taxRate || 0) + (record.serviceRate || 0) > 0 && (
                                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Incl. Tax & Service</p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-3 flex gap-2">
                                <button
                                    onClick={() => handleNavigate(record)}
                                    className="flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                                    style={{ background: 'var(--info-bg)', color: 'var(--info-color)' }}
                                >
                                    <MapPin size={14} /> {record.location ? "GPS Navigate" : "Navigate"}
                                </button>

                                <button
                                    onClick={() => setSelectedReceipt(record)}
                                    className="flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                                    style={{ background: 'var(--brand-bg)', color: 'var(--brand-primary)' }}
                                >
                                    <Receipt size={14} /> View Receipt
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Receipt Modal */}
            {selectedReceipt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="relative w-full max-w-sm">
                        <button
                            onClick={() => setSelectedReceipt(null)}
                            className="absolute -top-12 right-0 text-white p-2"
                        >
                            <X size={24} />
                        </button>

                        {/* Receiptify Style View */}
                        <div id="history-receipt-view" className="bg-white p-8 font-mono text-black relative">
                            <div className="flex flex-col items-center mb-6 border-b-2 border-black pb-4">
                                <SausageDogLogo className="w-16 h-10 mb-2 text-black" />
                                <h2 className="text-2xl font-black uppercase tracking-widest">RECEIPT</h2>
                                <p className="text-xs mt-1">{new Date(selectedReceipt.timestamp).toLocaleString()}</p>
                                <p className="text-xs uppercase mt-1">{selectedReceipt.restaurantName || "SAUSAGE PAL DINER"}</p>
                            </div>

                            <div className="space-y-4 mb-6">
                                {selectedReceipt.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span className="uppercase truncate w-2/3">{item.item.translatedName}</span>
                                        <span className="font-bold">{item.item.price * item.quantity}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t-2 border-black pt-4 mb-6 space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span>SUBTOTAL</span>
                                    <span>{selectedReceipt.totalOriginalPrice} {selectedReceipt.currency}</span>
                                </div>
                                {(selectedReceipt.taxRate || 0) > 0 && (
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>TAX ({selectedReceipt.taxRate}%)</span>
                                        <span>{(selectedReceipt.totalOriginalPrice * selectedReceipt.taxRate / 100).toFixed(0)}</span>
                                    </div>
                                )}
                                {(selectedReceipt.serviceRate || 0) > 0 && (
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>SERVICE ({selectedReceipt.serviceRate}%)</span>
                                        <span>{(selectedReceipt.totalOriginalPrice * selectedReceipt.serviceRate / 100).toFixed(0)}</span>
                                    </div>
                                )}

                                {/* Enhanced Total for History */}
                                <div className="flex justify-between items-end mt-2 pt-2 border-t border-dashed border-black">
                                    <span className="font-bold text-black uppercase text-sm">TOTAL</span>
                                    <span className="font-black text-3xl text-black">
                                        {calculateFinalTotal(selectedReceipt).toFixed(0)} {selectedReceipt.currency}
                                    </span>
                                </div>

                                {/* Note: In History, we don't have exchange rate data stored typically. 
                               So we only show the original currency to be accurate. */}
                                <p className="text-[10px] text-gray-400 text-right mt-1">* Historical exchange rates not stored</p>

                                {selectedReceipt.paidBy && (
                                    <p className="text-xs text-right mt-2 uppercase font-bold text-black">PAID BY: {selectedReceipt.paidBy}</p>
                                )}
                            </div>

                            {/* Highlight Most Expensive */}
                            <div className="border-2 border-black p-2 text-center mb-6">
                                <p className="text-[10px] uppercase font-bold">★ BIGGEST SPLURGE ★</p>
                                <p className="text-sm font-bold uppercase">
                                    {selectedReceipt.items.reduce((p, c) => (p.item.price * p.quantity > c.item.price * c.quantity) ? p : c).item.translatedName}
                                </p>
                            </div>

                            <div className="text-center opacity-50">
                                <div className="h-8 bg-[repeating-linear-gradient(90deg,black,black_1px,white_1px,white_3px)] mb-1"></div>
                                <p className="text-[10px]">IG: @SausageMenuPal</p>
                            </div>
                        </div>

                        <button
                            onClick={handleDownloadReceipt}
                            className="w-full font-bold py-4 mt-4 rounded-xl flex items-center justify-center gap-2 shadow-lg"
                            style={{ background: 'var(--brand-gradient)', color: 'white' }}
                        >
                            <Share2 size={20} /> Save for Stories
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};