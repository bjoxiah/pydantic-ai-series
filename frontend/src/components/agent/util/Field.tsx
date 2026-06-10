'use client';

export const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode; }) => {
	return (
		<div className="flex flex-col gap-1.5">
			<label className="text-[9px] font-bold tracking-widest uppercase text-gray-400">{label}</label>
			{children}
			{error && <span className="text-[10px] text-red-500">{error}</span>}
		</div>
	);
};
