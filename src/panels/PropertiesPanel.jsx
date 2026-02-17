import React, { useCallback } from 'react';
import useProjectStore from '../stores/projectStore';

export default function PropertiesPanel() {
  const selectedNodeId = useProjectStore((s) => s.selectedNodeId);
  const selectedEdgeId = useProjectStore((s) => s.selectedEdgeId);
  const project = useProjectStore((s) => s.project);
  const updateWindowConfig = useProjectStore((s) => s.updateWindowConfig);
  const updateEdge = useProjectStore((s) => s.updateEdge);
  const removeNode = useProjectStore((s) => s.removeNode);
  const removeEdge = useProjectStore((s) => s.removeEdge);

  if (selectedNodeId && project.windows[selectedNodeId]) {
    return (
      <NodeProperties
        nodeId={selectedNodeId}
        config={project.windows[selectedNodeId]}
        onUpdate={updateWindowConfig}
        onDelete={removeNode}
      />
    );
  }

  if (selectedEdgeId) {
    const edge = project.graph.edges.find((e) => e.id === selectedEdgeId);
    if (edge) {
      return (
        <EdgeProperties
          edge={edge}
          onUpdate={updateEdge}
          onDelete={removeEdge}
        />
      );
    }
  }

  return null;
}

function NodeProperties({ nodeId, config, onUpdate, onDelete }) {
  const handleChange = useCallback(
    (field, value) => {
      onUpdate(nodeId, { [field]: value });
    },
    [nodeId, onUpdate]
  );

  const handleNumberChange = useCallback(
    (field, value) => {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num > 0) {
        onUpdate(nodeId, { [field]: num });
      }
    },
    [nodeId, onUpdate]
  );

  return (
    <div className="properties-panel">
      <div className="panel-header">
        <h3>Window Properties</h3>
        <button
          className="btn-danger"
          onClick={() => onDelete(nodeId)}
          title="Delete window"
        >
          Delete
        </button>
      </div>

      <div className="panel-section">
        <label>
          Title
          <input
            type="text"
            value={config.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
          />
        </label>
      </div>

      <div className="panel-section panel-row">
        <label>
          Width
          <input
            type="number"
            value={config.width || 800}
            onChange={(e) => handleNumberChange('width', e.target.value)}
            min={200}
          />
        </label>
        <label>
          Height
          <input
            type="number"
            value={config.height || 600}
            onChange={(e) => handleNumberChange('height', e.target.value)}
            min={150}
          />
        </label>
      </div>

      <div className="panel-section">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={config.resizable !== false}
            onChange={(e) => handleChange('resizable', e.target.checked)}
          />
          Resizable
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={config.frame !== false}
            onChange={(e) => handleChange('frame', e.target.checked)}
          />
          Show Frame
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={config.modal || false}
            onChange={(e) => handleChange('modal', e.target.checked)}
          />
          Modal
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={config.transparent || false}
            onChange={(e) => handleChange('transparent', e.target.checked)}
          />
          Transparent
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={config.alwaysOnTop || false}
            onChange={(e) => handleChange('alwaysOnTop', e.target.checked)}
          />
          Always on Top
        </label>
      </div>

      <div className="panel-section">
        <label>
          Background Color
          <div className="color-input-row">
            <input
              type="color"
              value={config.backgroundColor || '#ffffff'}
              onChange={(e) => handleChange('backgroundColor', e.target.value)}
            />
            <input
              type="text"
              value={config.backgroundColor || '#ffffff'}
              onChange={(e) => handleChange('backgroundColor', e.target.value)}
              className="color-text"
            />
          </div>
        </label>
      </div>

      <div className="panel-section">
        <h4>IPC Channels</h4>
        <ChannelList
          label="Listens"
          channels={config.ipc?.listens || []}
          onChange={(channels) =>
            onUpdate(nodeId, { ipc: { ...config.ipc, listens: channels } })
          }
        />
        <ChannelList
          label="Emits"
          channels={config.ipc?.emits || []}
          onChange={(channels) =>
            onUpdate(nodeId, { ipc: { ...config.ipc, emits: channels } })
          }
        />
      </div>
    </div>
  );
}

function EdgeProperties({ edge, onUpdate, onDelete }) {
  return (
    <div className="properties-panel">
      <div className="panel-header">
        <h3>Edge Properties</h3>
        <button
          className="btn-danger"
          onClick={() => onDelete(edge.id)}
          title="Delete edge"
        >
          Delete
        </button>
      </div>

      <div className="panel-section">
        <label>
          Label
          <input
            type="text"
            value={edge.label || ''}
            onChange={(e) => onUpdate(edge.id, { label: e.target.value })}
          />
        </label>
      </div>

      <div className="panel-section">
        <label>
          Type
          <select
            value={edge.type || 'navigation'}
            onChange={(e) => onUpdate(edge.id, { type: e.target.value })}
          >
            <option value="navigation">Navigation</option>
            <option value="ipc">IPC</option>
            <option value="state">Shared State</option>
          </select>
        </label>
      </div>

      <div className="panel-section info">
        <p>
          <strong>Source:</strong> {edge.source}
        </p>
        <p>
          <strong>Target:</strong> {edge.target}
        </p>
      </div>
    </div>
  );
}

function ChannelList({ label, channels, onChange }) {
  const addChannel = () => {
    const name = prompt(`New ${label.toLowerCase()} channel name:`);
    if (name && name.trim()) {
      onChange([...channels, name.trim()]);
    }
  };

  const removeChannel = (index) => {
    onChange(channels.filter((_, i) => i !== index));
  };

  return (
    <div className="channel-list">
      <div className="channel-list-header">
        <span className="dim">{label}</span>
        <button className="btn-small" onClick={addChannel}>
          +
        </button>
      </div>
      {channels.map((ch, i) => (
        <div key={i} className="channel-item">
          <span>{ch}</span>
          <button className="btn-remove" onClick={() => removeChannel(i)}>
            ×
          </button>
        </div>
      ))}
      {channels.length === 0 && <span className="dim small">None</span>}
    </div>
  );
}
