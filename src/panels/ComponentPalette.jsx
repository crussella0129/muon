import React from 'react';
import { COMPONENT_TYPES } from '../components/componentDefs';

const types = Object.values(COMPONENT_TYPES);

export default function ComponentPalette() {
  const handleDragStart = (e, type) => {
    e.dataTransfer.setData('application/muon-component', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="component-palette">
      {types.map((def) => (
        <div
          key={def.type}
          className="palette-item"
          draggable
          onDragStart={(e) => handleDragStart(e, def.type)}
        >
          <span className="palette-icon">{def.icon}</span>
          <span className="palette-label">{def.label}</span>
        </div>
      ))}
    </div>
  );
}
