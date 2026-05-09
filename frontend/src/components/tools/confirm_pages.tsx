import { SharedState } from '@/models';
import { ToolCallStatus, useAgent, useHumanInTheLoop } from '@copilotkit/react-core/v2';
import { useState } from 'react';
import { z } from 'zod';

export const ConfirmPageTool = () => {
	useHumanInTheLoop(
		{
			name: 'confirm_page',
			description: 'Ask the user to confirm pages before generation',
			parameters: z.object({
				project_name: z
					.string()
					.describe('The name of the project the user is working on'),
				page_list: z.array(
					z.object({
						name: z.string().describe('The name of the page'),
						description: z
							.string()
							.describe('A brief description of the page'),
					}),
				),
			}),

			render: ({ args, status, respond, result }) => {
				if (status === ToolCallStatus.InProgress) {
					return (
						<div className="p-4 text-gray-500">
							Preparing confirmation...
						</div>
					);
				}

				if (status === ToolCallStatus.Executing && respond) {
					return <PageConfirm args={args} respond={respond} />;
				}

				if (status === ToolCallStatus.Complete && result) {
					return (
						<div className="p-2 text-sm text-gray-600">
							{/* {result} */}
						</div>
					);
				}

				return null;
			},
		},
		[],
	);

	return null;
};

const PageConfirm = ({
	args,
	respond,
}: {
	args: {
		project_name: string;
		page_list: { name: string; description: string }[];
	};
	respond: (response: unknown) => void;
}) => {
    const { agent } = useAgent();
	const [selected, setSelected] = useState<Set<number>>(
		new Set(args.page_list.map((_, i) => i)),
	);

	const toggle = (idx: number) => {
		setSelected((prev) => {
			const next = new Set(prev);
			next.has(idx) ? next.delete(idx) : next.add(idx);
			return next;
		});
	};

	const handleConfirm = () => {
		const confirmedPages = args.page_list.filter((_, i) => selected.has(i));

        const updatedState: SharedState = {
            project_name: args.project_name,
            confirmed_pages: confirmedPages,
            generated_pages: []
        }
        agent.setState(updatedState)
		respond({ confirmed: true, confirmed_pages: confirmedPages });
	};

	return (
		<div className="p-4 border rounded space-y-3">
			<p className="font-medium">
				Confirm pages to generate for{' '}
				<span className="font-semibold">{args.project_name}</span>:
			</p>

			<div className="space-y-2">
				{args.page_list.map((page, idx) => (
					<label
						key={idx}
						className="flex items-start gap-3 p-2 border rounded cursor-pointer hover:bg-gray-50"
					>
						<input
							type="checkbox"
							className="mt-1"
							checked={selected.has(idx)}
							onChange={() => toggle(idx)}
						/>
						<div>
							<p className="font-semibold">{page.name}</p>
							<p className="text-sm text-gray-600">
								{page.description}
							</p>
						</div>
					</label>
				))}
			</div>

			<div className="flex gap-2 mt-2">
				<button
					onClick={() => respond({ confirmed: false })}
					className="flex-1 border px-4 py-2 rounded hover:bg-gray-50 transition-colors"
				>
					Cancel
				</button>
				<button
					onClick={handleConfirm}
					disabled={selected.size === 0}
					className="flex-1 bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
				>
					Confirm {selected.size > 0 ? `(${selected.size})` : ''}
				</button>
			</div>
		</div>
	);
};
