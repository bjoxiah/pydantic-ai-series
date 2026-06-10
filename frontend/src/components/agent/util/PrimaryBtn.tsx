'use client';

export const PrimaryBtn = ({ onClick, disabled, loading, loadingText, children, danger }: {
	onClick: () => void; disabled?: boolean; loading?: boolean; loadingText?: string; children: React.ReactNode; danger?: boolean;
}) => {
	return (
		<button
			onClick={onClick} disabled={disabled}
			className={`flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-mono tracking-wide text-white rounded-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-px active:translate-y-0 shadow-sm ${danger ? 'bg-red-500 hover:bg-red-400' : 'bg-violet-600 hover:bg-violet-500'}`}
		>
			{loading ? <><span className="w-2.5 h-2.5 rounded-full border-[1.5px] border-white/40 border-t-white animate-spin" />{loadingText}</> : children}
		</button>
	);
};
