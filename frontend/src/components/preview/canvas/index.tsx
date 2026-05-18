/* eslint-disable @typescript-eslint/no-explicit-any */
import { GeneratedPages } from '@/models';
import {
	ReactFlow,
	Controls,
	Background,
	useNodesState,
	NodeProps,
	NodeResizer,
    useReactFlow
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { useEffect } from 'react';

const NODE_W = 1440;
const NODE_H = 900;
const GAP = 200;

const nodeTypes = {
	pageNode: ({ data, selected }: NodeProps) => {
        const iframeData = data as any;
		console.log(iframeData)
		return (
			<div className='flex h-full bg-gray-200'>
				<NodeResizer
					isVisible={!!selected}
					minWidth={400}
					minHeight={300}
					lineStyle={{
						borderColor: 'rgba(99,102,241,0.4)',
						borderWidth: 6,
						borderStyle: 'solid',
					}}
					handleStyle={{
						width: 10,
						height: 10,
						borderRadius: '50%',
						background: '#fff',
						border: '2px solid #6366f1',
						boxShadow: '0 0 0 3px rgba(99,102,241,0.15)',
					}}
				/>

				<div className="flex-1 relative overflow-hidden">
					{iframeData && iframeData.html && (
						<iframe
							srcDoc={iframeData.html}
							sandbox="allow-scripts"
							title={iframeData.name}
							className="absolute inset-0 w-full h-full border-0"
							style={{ pointerEvents: 'none' }}
						/>
					)}
				</div>
			</div>
		);
	},
};

type Props = {
    pages: GeneratedPages[]
}

export const CanvasComponent = ({ pages }: Props) => {
	const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const {fitView} = useReactFlow();

    const handleInit = () => {
        const pagesNode: any = pages.map((page, index) => {
            return {
                id: String(index + 1),
                type: 'pageNode',
                position: { x: (index + 1) * (NODE_W + GAP), y: 0 },
                data: { ...page },
                style: { width: NODE_W, height: NODE_H },
            }
        })
        setNodes(pagesNode)
        fitView({ padding: 0.15, duration: 400 });
    }		

    useEffect(() => {
        if (pages.length) {
            handleInit()
        }
        
    }, [pages])

	return (
		<ReactFlow
			nodes={nodes}
			onNodesChange={onNodesChange}
			nodeTypes={nodeTypes}
			proOptions={{ hideAttribution: true }}
			nodesDraggable={true}
			panOnScroll={true}
			zoomOnPinch
			zoomOnDoubleClick={false}
			nodesConnectable={false}
			selectNodesOnDrag={false}
			minZoom={0.04}
			maxZoom={2}
		>
			<Controls />
			<Background color='#22da' size={8} gap={20}/>
		</ReactFlow>
	);
};
