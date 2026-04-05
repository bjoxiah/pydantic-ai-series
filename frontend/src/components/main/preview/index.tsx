'use client';
import { useAppStore } from '@/store';
import { ExchangeRateSnapshot } from '@/model/snapshot';
import { CURRENCY_META } from '@/components/currency';

const RateCard = ({ code, rate, name, base }: {
    code: string; rate: number | null; name?: string; base: string;
}) => {
    const meta = CURRENCY_META[code];
    const isLoading = rate === null || rate === undefined;

    return (
        <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shrink-0">
                {meta?.flag ?? '🏳️'}
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800">{code}</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {name ?? meta?.name ?? code}
                </p>
            </div>

            <div className="text-right shrink-0 min-w-24">
                {isLoading ? (
                    <div className="flex gap-1.5 justify-end items-center h-8">
                        {[0, 1, 2].map(i => (
                            <div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full bg-indigo-200 animate-bounce"
                                style={{ animationDelay: `${i * 150}ms` }}
                            />
                        ))}
                    </div>
                ) : (
                    <>
                        <p className="text-2xl font-black font-mono leading-none text-indigo-600">
                            {(rate as number).toFixed(4)}
                        </p>
                        <p className="text-xs font-mono text-slate-400 mt-1">per 1 {base}</p>
                    </>
                )}
            </div>
        </div>
    );
}

export const PreviewComponent = () => {
    const snapshot = useAppStore(s => s.snapshot) as ExchangeRateSnapshot | null;

    if (!snapshot || snapshot.status === 'idle') {
        return (
            <div className="h-full flex flex-col items-center justify-center gap-5 p-8 bg-slate-50">
                <span className="text-5xl opacity-20">€</span>
                <div className="text-center">
                    <p className="text-sm font-semibold text-slate-500">No rates yet</p>
                    <p className="text-xs text-slate-300 mt-1.5">Ask for exchange rates to get started</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto bg-slate-50">
            <div className="max-w-sm mx-auto p-6 flex flex-col gap-4">

                {/* header */}
                <div className="rounded-2xl p-5 bg-indigo-600 shadow-lg shadow-indigo-200">
                    <div className="flex items-center gap-4">
                        <span className="text-3xl">🇺🇸</span>
                        <div className="flex-1">
                            <p className="text-xs font-mono uppercase tracking-widest text-indigo-200">
                                Base currency
                            </p>
                            <p className="text-2xl font-black text-white tracking-tight mt-0.5">
                                1 {snapshot.base ?? 'USD'}
                            </p>
                            {snapshot.date && snapshot.status === 'done' && (
                                <p className="text-xs font-mono text-indigo-200 opacity-70 mt-0.5">
                                    {new Date(snapshot.date).toLocaleDateString('en-GB', {
                                        day: 'numeric', month: 'short', year: 'numeric',
                                    })}
                                </p>
                            )}
                        </div>
                        <div className="px-3 py-1.5 rounded-full bg-white/15 text-xs font-mono text-white/80 shrink-0">
                            {snapshot.status === 'fetching' ? 'loading...' : 'live'}
                        </div>
                    </div>
                </div>

                {/* rate cards */}
                <div className="flex flex-col gap-2.5">
                    {(snapshot.rates ?? []).map(({ code, rate, name }) => (
                        <RateCard
                            key={code}
                            code={code}
                            rate={rate as number | null}
                            name={name}
                            base={snapshot.base ?? 'USD'}
                        />
                    ))}
                </div>

                {snapshot.status === 'done' && (
                    <p className="text-xs text-center text-slate-300 font-mono pb-1">
                        Powered by OpenExchangeRates
                    </p>
                )}
            </div>
        </div>
    );
};