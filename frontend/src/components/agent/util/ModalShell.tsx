'use client';

export const ModalShell = ({ children, onClose, width = '460px' }: { children: React.ReactNode; onClose: () => void; width?: string; }) => {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-150" onClick={onClose}>
			<div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-xl animate-in slide-in-from-bottom-3 duration-200" style={{ width }} onClick={e => e.stopPropagation()}>
				{children}
			</div>
		</div>
	);
};
