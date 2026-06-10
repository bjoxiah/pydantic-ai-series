'use client';

export const SecondaryBtn = ({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode; }) => {
	return (
		<button onClick={onClick} disabled={disabled} className="px-3.5 cursor-pointer py-1.5 text-[11px] font-mono tracking-wide text-gray-500 border border-gray-200 rounded-md hover:border-gray-300 hover:text-gray-700 transition-all disabled:opacity-40 bg-white">
			{children}
		</button>
	);
};
