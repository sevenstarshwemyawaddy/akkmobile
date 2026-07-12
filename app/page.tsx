// app/page.tsx
"use client";
import { useState } from 'react';

export default function Home() {
    const [imeiInput, setImeiInput] = useState('');
    const [results, setResults] = useState<{imei: string, error?: string, imeiStatus?: string, taxPaymentStatus?: string, deviceBlockingStatus?: string, status?: string}[]>([]);
    const [loading, setLoading] = useState(false);

    const handleCheck = async () => {
        const imeis = imeiInput.split(/[\n,]+/).map(i => i.trim()).filter(i => /^\d{15}$/.test(i));
        if (imeis.length === 0) return alert("Please enter valid 15-digit IMEIs.");

        setLoading(true);
        setResults([]);

        for (const imei of imeis) {
            try {
                const res = await fetch('/api/check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imei })
                });
                const data = await res.json();
                setResults(prev => [...prev, { imei, ...data }]);
            } catch (err) {
                setResults(prev => [...prev, { imei, error: "Failed to check" }]);
            }
        }
        setLoading(false);
    };

    const getStatusColor = (status: string | undefined) => {
        if (!status) return "text-gray-400";
        const s = status.toLowerCase();
        return (s.includes('paid') || s.includes('correct') || s.includes('allowed')) ? "text-green-400" : "text-red-400";
    };

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 p-8 font-mono">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold mb-2 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">🛰️ CEIR AKK Mobile API</h1>
                <p className="text-gray-400 mb-6">Bulk check IMEI status bypassing ALTCHA proof-of-work.</p>
                
                <textarea 
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4 focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-gray-600"
                    rows={5}
                    placeholder="Enter IMEIs here (separated by comma or new line)...&#10;863436076606831&#10;863436076606832"
                    value={imeiInput}
                    onChange={(e) => setImeiInput(e.target.value)}
                />
                
                <button 
                    onClick={handleCheck}
                    disabled={loading}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-[0_0_15px_rgba(8,145,178,0.6)] disabled:opacity-50"
                >
                    {loading ? "Checking Database..." : "Scan IMEIs"}
                </button>

                {results.length > 0 && (
                    <div className="mt-8 space-y-4">
                        {results.map((r, i) => (
                            <div key={i} className="bg-gray-900 border border-gray-800 p-4 rounded-lg shadow-lg">
                                <h3 className="text-lg font-bold mb-2 text-white">IMEI: {r.imei}</h3>
                                {r.error ? (
                                    <p className="text-red-400">{r.error}</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div className="bg-gray-800 p-2 rounded">
                                            <span className="text-gray-400 block text-xs">IMEI Status</span>
                                            <span className={`font-bold ${getStatusColor(r.imeiStatus || r.status)}`}>{r.imeiStatus || r.status || "N/A"}</span>
                                        </div>
                                        <div className="bg-gray-800 p-2 rounded">
                                            <span className="text-gray-400 block text-xs">Tax Status</span>
                                            <span className={`font-bold ${getStatusColor(r.taxPaymentStatus)}`}>{r.taxPaymentStatus || "N/A"}</span>
                                        </div>
                                        <div className="bg-gray-800 p-2 rounded">
                                            <span className="text-gray-400 block text-xs">Block Status</span>
                                            <span className={`font-bold ${getStatusColor(r.deviceBlockingStatus)}`}>{r.deviceBlockingStatus || "N/A"}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}