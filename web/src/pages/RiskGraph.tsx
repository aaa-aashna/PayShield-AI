import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Network, Search, AlertCircle, ArrowRight, CornerDownRight } from 'lucide-react';
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
    { label: 'Cust 1376 (Compromised)', type: 'customer' as const, id: '1376' },
    { label: 'Cust 1488 (Spike)', type: 'customer' as const, id: '1488' },
    { label: 'Term 8023 (Risky Hub)', type: 'terminal' as const, id: '8023' },
    { label: 'Term 1205 (Normal Merchant)', type: 'terminal' as const, id: '1205' },
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
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      {/* 1. Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-widest text-ink-muted">
              Topology Explorer
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
              Risk graph intelligence
            </h1>
            <p className="text-sm text-ink-secondary max-w-xl font-sans pt-1">
              Bipartite graph network analyzing cardholder-to-terminal relationships and syndicate clustering.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-ink-muted">
            <span>Graph engine:</span>
            <span className="font-semibold text-ink bg-surface border border-surface-border px-2.5 py-1">
              Bipartite Network v1.0
            </span>
          </div>
        </div>

        {/* 2. Query Controls & Presets */}
        <div className="bg-surface border border-surface-border p-4 space-y-3 font-mono text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex border border-surface-border overflow-hidden">
              <button
                onClick={() => setEntityType('customer')}
                className={`px-3 py-1.5 transition ${
                  entityType === 'customer'
                    ? 'bg-ink text-white font-semibold'
                    : 'bg-background text-ink-secondary hover:text-ink'
                }`}
              >
                Customer
              </button>
              <button
                onClick={() => setEntityType('terminal')}
                className={`px-3 py-1.5 transition ${
                  entityType === 'terminal'
                    ? 'bg-ink text-white font-semibold'
                    : 'bg-background text-ink-secondary hover:text-ink'
                }`}
              >
                Terminal
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-ink-muted uppercase text-[11px]">Entity ID:</span>
              <input
                type="text"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                className="bg-background border border-surface-border px-3 py-1.5 text-ink focus:border-ink outline-none w-28"
                placeholder="1376"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-ink-muted uppercase text-[11px]">Neighborhood Depth:</span>
              <select
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
                className="bg-background border border-surface-border px-2.5 py-1.5 text-ink focus:border-ink outline-none"
              >
                <option value={1}>1-Hop (Direct)</option>
                <option value={2}>2-Hops (Bipartite)</option>
                <option value={3}>3-Hops (Extended)</option>
              </select>
            </div>

            <button
              onClick={fetchGraph}
              disabled={loading}
              className="bg-ink hover:bg-neutral-800 text-white font-medium px-4 py-1.5 text-xs transition disabled:opacity-50 ml-auto"
            >
              {loading ? 'Rendering map...' : 'Render topology →'}
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-surface-border text-[11px]">
            <span className="text-ink-muted uppercase">Sample entities:</span>
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => handlePresetSelect(p)}
                className="bg-surface-subtle hover:bg-neutral-200 text-ink-secondary hover:text-ink px-2 py-0.5 border border-surface-border transition"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Map Canvas & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Canvas */}
        <div className="lg:col-span-8 bg-surface border border-surface-border p-4 relative min-h-[480px] flex flex-col justify-between">
          {/* Canvas Legend */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-surface-border font-mono text-[11px] text-ink-muted">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Center query
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" /> Suspicious entity
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600" /> Merchant terminal
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-ink" /> Customer
              </span>
            </div>
            <span>Click any node to inspect</span>
          </div>

          {/* Graph Visualization */}
          <div className="flex-1 flex items-center justify-center py-4">
            {loading ? (
              <LoadingState message="Calculating network topology..." className="py-20" />
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
                      stroke="#d4d4d0"
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
              <EmptyState title="No Connections Found" description="Try increasing the hop depth or querying a different entity ID." />
            )}
          </div>
        </div>

        {/* Inspector Side-Panel */}
        <div className="lg:col-span-4 space-y-6 font-mono text-xs bg-surface border border-surface-border p-4">
          <div className="border-b border-surface-border pb-3">
            <h2 className="text-xs font-mono uppercase tracking-widest text-ink font-semibold">
              Selected entity details
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
                  <span className={`font-bold ${selectedNode.is_suspicious ? 'text-risk-critical' : 'text-risk-low'}`}>
                    {selectedNode.is_suspicious ? 'ELEVATED RISK' : 'CLEAN PROFILE'}
                  </span>
                </div>
              </div>

              {/* Connected Relationships Table */}
              <div className="space-y-2 pt-3 border-t border-surface-border">
                <div className="text-ink-muted uppercase text-[11px]">Connected peers (Click to pivot):</div>
                <div className="space-y-1 max-h-52 overflow-y-auto">
                  {graphData?.edges
                    .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                    .map((edge, idx) => {
                      const peerId = edge.source === selectedNode.id ? edge.target : edge.source;
                      return (
                        <div
                          key={idx}
                          onClick={() => handlePivot(peerId)}
                          className="flex justify-between items-center py-1.5 px-2 bg-background hover:bg-neutral-200 cursor-pointer transition border border-surface-border"
                        >
                          <span className="text-ink font-medium hover:underline">{peerId}</span>
                          <span className="text-ink-muted text-[11px]">{edge.weight} Authorizations</span>
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
