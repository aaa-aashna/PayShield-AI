import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { SubgraphData, GraphNode } from '../types';

export const RiskGraph: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('entity_id') || '1376';
  const initialType = (searchParams.get('entity_type') as 'customer' | 'terminal') || 'customer';

  const [entityType, setEntityType] = useState<'customer' | 'terminal'>(initialType);
  const [entityId, setEntityId] = useState(initialId);
  const [depth, setDepth] = useState(2);
  const [graphData, setGraphData] = useState<SubgraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchGraph = async () => {
    setLoading(true);
    try {
      const data = await api.getSubgraph(entityId, entityType, depth);
      setGraphData(data);
      if (data.nodes.length > 0) {
        setSelectedNode(data.nodes.find((n) => n.is_center) || data.nodes[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
      {/* 1. Header */}
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-widest text-ink-muted">
            Intelligence
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-ink">
            Risk graph
          </h1>
          <p className="text-sm text-ink-secondary max-w-xl font-sans pt-1">
            Entity relationship map showing connected customers and terminals.
          </p>
        </div>

        {/* Query Controls */}
        <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-surface-border font-mono text-xs">
          <div className="flex rounded-none border border-surface-border overflow-hidden">
            <button
              onClick={() => setEntityType('customer')}
              className={`px-3 py-1.5 ${
                entityType === 'customer'
                  ? 'bg-ink text-white font-semibold'
                  : 'bg-surface text-ink-secondary hover:text-ink'
              }`}
            >
              Customer
            </button>
            <button
              onClick={() => setEntityType('terminal')}
              className={`px-3 py-1.5 ${
                entityType === 'terminal'
                  ? 'bg-ink text-white font-semibold'
                  : 'bg-surface text-ink-secondary hover:text-ink'
              }`}
            >
              Terminal
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-ink-muted">ID:</span>
            <input
              type="text"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              className="bg-surface border border-surface-border rounded-none px-3 py-1.5 text-ink focus:border-ink outline-none w-24"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-ink-muted">Depth:</span>
            <select
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="bg-surface border border-surface-border rounded-none px-2.5 py-1.5 text-ink focus:border-ink outline-none"
            >
              <option value={1}>1-Hop</option>
              <option value={2}>2-Hops</option>
              <option value={3}>3-Hops</option>
            </select>
          </div>

          <button
            onClick={fetchGraph}
            disabled={loading}
            className="bg-ink hover:bg-neutral-800 text-white font-medium px-4 py-1.5 rounded-none text-xs transition disabled:opacity-50"
          >
            {loading ? 'Rendering...' : 'Render map →'}
          </button>
        </div>
      </div>

      {/* 2. Map Canvas & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
        {/* Canvas */}
        <div className="lg:col-span-8 bg-surface border border-surface-border p-4 relative min-h-[460px] flex items-center justify-center">
          {graphData && graphData.nodes.length > 0 ? (
            <svg className="w-full h-full min-h-[420px]" viewBox="0 0 600 380">
              {/* Edges */}
              {graphData.edges.map((edge, idx) => {
                const sourceIdx = graphData.nodes.findIndex((n) => n.id === edge.source);
                const targetIdx = graphData.nodes.findIndex((n) => n.id === edge.target);
                if (sourceIdx === -1 || targetIdx === -1) return null;

                const total = graphData.nodes.length;
                const radius = 135;
                const cx = 300;
                const cy = 190;

                const angleS = (sourceIdx / total) * 2 * Math.PI;
                const angleT = (targetIdx / total) * 2 * Math.PI;

                const x1 = graphData.nodes[sourceIdx].is_center ? cx : cx + radius * Math.cos(angleS);
                const y1 = graphData.nodes[sourceIdx].is_center ? cy : cy + radius * Math.sin(angleS);
                const x2 = graphData.nodes[targetIdx].is_center ? cx : cx + radius * Math.cos(angleT);
                const y2 = graphData.nodes[targetIdx].is_center ? cy : cy + radius * Math.sin(angleT);

                return (
                  <line
                    key={idx}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#d4d4d0"
                    strokeWidth={Math.min(2.5, Math.max(1, edge.weight * 0.5))}
                  />
                );
              })}

              {/* Nodes */}
              {graphData.nodes.map((node, idx) => {
                const total = graphData.nodes.length;
                const radius = 135;
                const cx = 300;
                const cy = 190;
                const angle = (idx / total) * 2 * Math.PI;

                const x = node.is_center ? cx : cx + radius * Math.cos(angle);
                const y = node.is_center ? cy : cy + radius * Math.sin(angle);

                let fill = '#0f172a';
                if (node.is_center) fill = '#2563eb';
                else if (node.is_suspicious) fill = '#b91c1c';
                else if (node.type === 'terminal') fill = '#d97706';

                const isSelected = selectedNode?.id === node.id;

                return (
                  <g
                    key={node.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedNode(node)}
                  >
                    {isSelected && (
                      <circle cx={x} cy={y} r={node.is_center ? 18 : 14} fill="none" stroke="#0f172a" strokeWidth={1} strokeDasharray="2 2" />
                    )}
                    <circle
                      cx={x}
                      cy={y}
                      r={node.is_center ? 10 : 7}
                      fill={fill}
                    />
                    <text
                      x={x}
                      y={y + 18}
                      textAnchor="middle"
                      fill="#475569"
                      fontSize="10"
                      fontFamily="JetBrains Mono"
                      fontWeight={node.is_center ? 'bold' : 'normal'}
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          ) : (
            <div className="text-xs font-mono text-ink-muted">No graph data found.</div>
          )}
        </div>

        {/* Inspector */}
        <div className="lg:col-span-4 space-y-6 font-mono text-xs">
          <div className="border-b border-surface-border pb-3">
            <h2 className="text-xs font-mono uppercase tracking-widest text-ink font-semibold">
              Selected entity
            </h2>
          </div>

          {selectedNode ? (
            <div className="space-y-6">
              <div className="space-y-1">
                <div className="text-ink-muted text-[11px]">Entity label</div>
                <div className="text-xl font-bold text-ink">{selectedNode.label}</div>
                <div className="text-ink-secondary capitalize">Type: {selectedNode.type}</div>
              </div>

              <div className="space-y-3 pt-3 border-t border-surface-border">
                <div className="flex justify-between items-baseline">
                  <span className="text-ink-muted">Total degree</span>
                  <span className="font-bold text-ink">{selectedNode.degree || 4} connections</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-ink-muted">Neighborhood risk</span>
                  <span className={`font-bold ${selectedNode.is_suspicious ? 'text-risk-critical' : 'text-risk-low'}`}>
                    {selectedNode.is_suspicious ? 'ELEVATED' : 'CLEAN'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-surface-border">
                <div className="text-ink-muted uppercase text-[11px]">Connected relationships</div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {graphData?.edges
                    .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                    .map((edge, idx) => {
                      const peerId = edge.source === selectedNode.id ? edge.target : edge.source;
                      return (
                        <div key={idx} className="flex justify-between items-center py-1 text-ink-secondary">
                          <span className="text-ink font-medium">{peerId}</span>
                          <span>{edge.weight} Tx</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-ink-muted">Click any node on the canvas to inspect connections.</div>
          )}
        </div>
      </div>
    </div>
  );
};
