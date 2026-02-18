import React from 'react';
import useProjectStore from '../stores/projectStore';
import ComponentPalette from './ComponentPalette';

export default function LeftSidebar() {
  const project = useProjectStore((s) => s.project);
  const activeScreenId = useProjectStore((s) => s.activeScreenId);
  const setActiveScreenId = useProjectStore((s) => s.setActiveScreenId);
  const setViewMode = useProjectStore((s) => s.setViewMode);
  const addNode = useProjectStore((s) => s.addNode);

  const nodes = project.graph.nodes;

  const handleScreenClick = (nodeId) => {
    setActiveScreenId(nodeId);
    setViewMode('editor');
  };

  const handleAddScreen = () => {
    addNode({ x: 200, y: 200 });
  };

  return (
    <div className="left-sidebar">
      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <span>Components</span>
        </div>
        <div className="sidebar-section-body">
          <ComponentPalette />
        </div>
      </div>

      <div className="sidebar-section sidebar-screens">
        <div className="sidebar-section-header">
          <span>Screens</span>
          <button className="btn-small" onClick={handleAddScreen} title="Add screen">+</button>
        </div>
        <div className="sidebar-screen-list">
          {nodes.map((node) => {
            const config = project.windows[node.id] || {};
            const isActive = activeScreenId === node.id;
            return (
              <div
                key={node.id}
                className={`screen-list-item ${isActive ? 'active' : ''}`}
                onClick={() => handleScreenClick(node.id)}
              >
                <div
                  className="screen-list-swatch"
                  style={{ backgroundColor: config.backgroundColor || '#ffffff' }}
                />
                <div className="screen-list-info">
                  <span className="screen-list-name">{config.title || node.id}</span>
                  <span className="screen-list-dims">
                    {config.width || 800} x {config.height || 600}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
