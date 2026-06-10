'use client';

export const ModalHeader = ({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void; }) => {
	return (
		<div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-gray-100">
			<div>
				<h2 className="font-semibold text-gray-800 text-sm tracking-wide">{title}</h2>
				{subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
			</div>
			<button onClick={onClose} className="w-6 h-6 rounded grid place-items-center border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors bg-white cursor-pointer">
				<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
			</button>
		</div>
	);
};
