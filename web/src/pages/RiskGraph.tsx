import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Network, Search, AlertCircle, ArrowRight } from 'lucide-react';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
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

  const presets = [
    { label: 'Customer 1376 (Compromised)', type: 'customer' as const, id: '1376' },
    { label: 'Customer 1488 (Burst Spike)', type: 'customer' as const, id: '1488' },
    { label: 'Terminal 8023 (Risky Hub)', type: 'terminal' as const, id: '8023' },
    { label: 'Terminal 1205 (Normal Merchant)', type: 'terminal' as const, id: '1205' },
  ];

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

  const handlePresetSelect = (preset: typeof presets[0]) => {
    setEntityType(preset.type);
    setEntityId(preset.id);
  };

  const handlePivot = (targetId: string) => {
    const isTerm = targetId.startsWith('T_') || targetId.startsWith('terminal');
    const cleanId = targetId.replace(/^[CT]_/, '');
    setEntityType(isTerm ? 'terminal' : 'customer');
    setEntityId(cleanId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
            Payment Entity Risk Graph
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Bipartite network topology analyzing cardholder-to-terminal relationships and syndicate clustering.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-ink-muted">
          <span>Engine:</span>
          <span className="font-semibold text-ink bg-white border border-surface-border px-3 py-1.5 rounded-md shadow-subtle">
            Bipartite Network v1.0
          </span>
        </div>
      </div>

      {/* 2. Query Toolbar & Presets */}
      <div className="bg-white border border-surface-border rounded-lg shadow-subtle p-4 space-y-4 font-mono text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
            <button
              onClick={() => setEntityType('customer')}
              className={`px-3 py-1 rounded text-xs transition font-medium ${
                entityType === 'customer'
                  ? 'bg-white text-ink shadow-subtle font-semibold'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              Customer
            </button>
            <button
              onClick={() => setEntityType('terminal')}
              className={`px-3 py-1 rounded text-xs transition font-medium ${
                entityType === 'terminal'
                  ? 'bg-white text-ink shadow-subtle font-semibold'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              Terminal
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-ink-muted uppercase font-semibold text-[11px]">Entity ID:</span>
            <input
              type="text"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              className="bg-slate-50 border border-surface-border rounded px-3 py-1.5 text-ink focus:border-brand outline-none w-28"
              placeholder="1376"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-ink-muted uppercase font-semibold text-[11px]">Hop Depth:</span>
            <select
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="bg-slate-50 border border-surface-border rounded px-3 py-1.5 text-ink focus:border-brand outline-none"
            >
              <option value={1}>1-Hop (Direct)</option>
              <option value={2}>2-Hops (Bipartite)</option>
              <option value={3}>3-Hops (Extended)</option>
            </select>
          </div>

          <button
            onClick={fetchGraph}
            disabled={loading}
            className="bg-ink hover:bg-slate-800 text-white font-medium px-4 py-1.5 rounded text-xs transition disabled:opacity-50 ml-auto shadow-subtle"
          >
            {loading ? 'Rendering map...' : 'Render Network →'}
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 text-xs">
          <span className="text-ink-muted uppercase font-semibold text-[11px]">Sample Entities:</span>
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => handlePresetSelect(p)}
              className="bg-slate-100 hover:bg-slate-200 text-ink-secondary hover:text-ink px-2.5 py-1 rounded border border-slate-200 transition"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Canvas (8 cols) & Inspector (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Canvas */}
        <div className="lg:col-span-8 bg-white border border-surface-border rounded-lg shadow-subtle p-5 flex flex-col justify-between min-h-[480px]">
          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-surface-border font-mono text-[11px] text-ink-muted">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Center Query
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" /> Suspicious Node
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600" /> Merchant Terminal
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900" /> Customer Account
              </span>
            </div>
            <span>Click any node to inspect connections</span>
          </div>

          {/* SVG Map */}
          <div className="flex-1 flex items-center justify-center py-4">
            {loading ? (
              <LoadingState message="Rendering network topology..." className="py-20" />
            ) : graphData && graphData.nodes.length > 0 ? (
              <svg className="w-full h-full min-h-[380px]" viewBox="0 0 600 360">
                {/* Edges */}
                {graphData.edges.map((edge, idx) => {
                  const sourceIdx = graphData.nodes.findIndex((n) => n.id === edge.source);
                  const targetIdx = graphData.nodes.findIndex((n) => n.id === edge.target);
                  if (sourceIdx === -1 || targetIdx === -1) return null;

                  const total = graphData.nodes.length;
                  const radius = 130;
                  const cx = 300;
                  const cy = 180;

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
                      stroke="#cbd5e1"
                      strokeWidth={Math.min(3, Math.max(1, edge.weight * 0.4))}
                    />
                  );
                })}

                {/* Nodes */}
                {graphData.nodes.map((node, idx) => {
                  const total = graphData.nodes.length;
                  const radius = 130;
                  const cx = 300;
                  const cy = 180;
                  const angle = (idx / total) * 2 * Math.PI;

                  const x = node.is_center ? cx : cx + radius * Math.cos(angle);
                  const y = node.is_center ? cy : cy + radius * Math.sin(angle);

                  let fill = '#0f172a';
                  if (node.is_center) fill = '#2563eb';
                  else if (node.is_suspicious) fill = '#dc2626';
                  else if (node.type === 'terminal') fill = '#d97706';

                  const isSelected = selectedNode?.id === node.id;

                  return (
                    <g
                      key={node.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedNode(node)}
                    >
                      {isSelected && (
                        <circle cx={x} cy={y} r={node.is_center ? 20 : 15} fill="none" stroke="#0f172a" strokeWidth={1.5} strokeDasharray="3 3" />
                      )}
                      <circle
                        cx={x}
                        cy={y}
                        r={node.is_center ? 11 : 8}
                        fill={fill}
                      />
                      <text
                        x={x}
                        y={y + 19}
                        textAnchor="middle"
                        fill="#475569"
                        fontSize="11"
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
              <EmptyState title="No Graph Data Found" description="Try querying a different entity ID or adjusting depth." />
            )}
          </div>
        </div>

        {/* Inspector Panel */}
        <div className="lg:col-span-4 bg-white border border-surface-border rounded-lg shadow-subtle p-5 space-y-6 font-mono text-xs">
          <div className="border-b border-surface-border pb-3">
            <h2 className="text-sm font-semibold text-ink">
              Selected Entity Inspector
            </h2>
          </div>

          {selectedNode ? (
            <div className="space-y-6">
              <div className="space-y-1">
                <div className="text-ink-muted text-[11px] uppercase">Entity Name</div>
                <div className="text-xl font-bold text-ink">{selectedNode.label}</div>
                <div className="text-ink-secondary capitalize">Type: {selectedNode.type}</div>
              </div>

              <div className="space-y-3 pt-3 border-t border-surface-border">
                <div className="flex justify-between items-baseline">
                  <span className="text-ink-muted">Degree centrality:</span>
                  <span className="font-bold text-ink">{selectedNode.degree || 4} associations</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-ink-muted">Neighborhood risk:</span>
                  <span className={`font-bold ${selectedNode.is_suspicious ? 'text-red-600' : 'text-emerald-600'}`}>
                    {selectedNode.is_suspicious ? 'ELEVATED RISK' : 'CLEAN PROFILE'}
                  </span>
                </div>
              </div>

              {/* Connected Relationships */}
              <div className="space-y-2 pt-3 border-t border-surface-border">
                <div className="text-ink-muted uppercase font-semibold text-[11px]">Connected Peers (Click to pivot):</div>
                <div className="space-y-1.5 max-h-52 overflow-y-auto">
                  {graphData?.edges
                    .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                    .map((edge, idx) => {
                      const peerId = edge.source === selectedNode.id ? edge.target : edge.source;
                      return (
                        <div
                          key={idx}
                          onClick={() => handlePivot(peerId)}
                          className="flex justify-between items-center py-2 px-2.5 bg-slate-50 hover:bg-slate-100 cursor-pointer transition rounded border border-slate-200"
                        >
                          <span className="text-brand font-medium hover:underline">{peerId}</span>
                          <span className="text-ink-muted text-[11px] font-numeric">{edge.weight} Txs</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-ink-muted py-8 text-center">
              Select any node on the graph canvas to inspect associations.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
