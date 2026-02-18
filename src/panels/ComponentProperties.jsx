import React from 'react';
import useProjectStore from '../stores/projectStore';

function findComponent(children, id) {
  for (const child of children) {
    if (child.id === id) return child;
    if (child.children) {
      const found = findComponent(child.children, id);
      if (found) return found;
    }
  }
  return null;
}

export default function ComponentProperties({ windowId, componentId }) {
  const project = useProjectStore((s) => s.project);
  const updateComponent = useProjectStore((s) => s.updateComponent);
  const removeComponent = useProjectStore((s) => s.removeComponent);
  const clearComponentSelection = useProjectStore((s) => s.clearComponentSelection);
  const setComponentAction = useProjectStore((s) => s.setComponentAction);

  const windowDef = project.windows[windowId];
  if (!windowDef) return null;

  const comp = findComponent(windowDef.children || [], componentId);
  if (!comp) return null;

  const handlePropChange = (prop, value) => {
    updateComponent(windowId, componentId, {
      props: { ...comp.props, [prop]: value },
    });
  };

  const handleStyleChange = (prop, value) => {
    updateComponent(windowId, componentId, {
      style: { ...comp.style, [prop]: value },
    });
  };

  const handleDelete = () => {
    removeComponent(windowId, componentId);
    clearComponentSelection();
  };

  // Get all window IDs for the navigate dropdown (exclude current window)
  const allWindows = Object.entries(project.windows)
    .filter(([id]) => id !== windowId)
    .map(([id, cfg]) => ({ id, title: cfg.title || id }));

  const currentNavigateTarget =
    comp.props?.actions?.onClick?.type === 'navigate'
      ? comp.props.actions.onClick.target
      : '';

  const handleNavigateChange = (targetId) => {
    if (targetId) {
      setComponentAction(windowId, componentId, 'onClick', {
        type: 'navigate',
        target: targetId,
      });
    } else {
      setComponentAction(windowId, componentId, 'onClick', null);
    }
  };

  return (
    <>
      <div className="panel-header">
        <h3>{comp.type.charAt(0).toUpperCase() + comp.type.slice(1)} Properties</h3>
        <button className="btn-danger" onClick={handleDelete} title="Delete component">
          Delete
        </button>
      </div>

      {/* Type-specific props */}
      <div className="panel-section">
        <h4>Properties</h4>
        {(comp.type === 'heading' || comp.type === 'paragraph' || comp.type === 'button') && (
          <label>
            Text
            <input
              type="text"
              value={comp.props.text || ''}
              onChange={(e) => handlePropChange('text', e.target.value)}
            />
          </label>
        )}
        {comp.type === 'heading' && (
          <label>
            Level
            <select
              value={comp.props.level || 1}
              onChange={(e) => handlePropChange('level', parseInt(e.target.value, 10))}
            >
              <option value={1}>H1</option>
              <option value={2}>H2</option>
              <option value={3}>H3</option>
              <option value={4}>H4</option>
              <option value={5}>H5</option>
              <option value={6}>H6</option>
            </select>
          </label>
        )}
        {comp.type === 'textInput' && (
          <>
            <label>
              Label
              <input
                type="text"
                value={comp.props.label || ''}
                onChange={(e) => handlePropChange('label', e.target.value)}
              />
            </label>
            <label>
              Placeholder
              <input
                type="text"
                value={comp.props.placeholder || ''}
                onChange={(e) => handlePropChange('placeholder', e.target.value)}
              />
            </label>
          </>
        )}
        {comp.type === 'image' && (
          <label>
            Alt Text
            <input
              type="text"
              value={comp.props.alt || ''}
              onChange={(e) => handlePropChange('alt', e.target.value)}
            />
          </label>
        )}
        {comp.type === 'container' && (
          <label>
            Direction
            <select
              value={comp.props.direction || 'column'}
              onChange={(e) => handlePropChange('direction', e.target.value)}
            >
              <option value="column">Vertical</option>
              <option value="row">Horizontal</option>
            </select>
          </label>
        )}
      </div>

      {/* Actions section for buttons */}
      {comp.type === 'button' && (
        <div className="panel-section">
          <h4>Actions</h4>
          <label>
            On Click
            <select
              value={currentNavigateTarget}
              onChange={(e) => handleNavigateChange(e.target.value)}
            >
              <option value="">None</option>
              {allWindows.map((w) => (
                <option key={w.id} value={w.id}>
                  Navigate to {w.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {/* Common style editors */}
      <div className="panel-section">
        <h4>Style</h4>
        {comp.type !== 'divider' && (
          <label>
            Color
            <div className="color-input-row">
              <input
                type="color"
                value={comp.style?.color || '#000000'}
                onChange={(e) => handleStyleChange('color', e.target.value)}
              />
              <input
                type="text"
                value={comp.style?.color || '#000000'}
                onChange={(e) => handleStyleChange('color', e.target.value)}
                className="color-text"
              />
            </div>
          </label>
        )}
        {(comp.type === 'button' || comp.type === 'container' || comp.type === 'image') && (
          <label>
            Background
            <div className="color-input-row">
              <input
                type="color"
                value={comp.style?.backgroundColor || '#ffffff'}
                onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
              />
              <input
                type="text"
                value={comp.style?.backgroundColor || '#ffffff'}
                onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                className="color-text"
              />
            </div>
          </label>
        )}
        {(comp.type === 'heading' || comp.type === 'paragraph' || comp.type === 'button') && (
          <label>
            Text Align
            <select
              value={comp.style?.textAlign || 'left'}
              onChange={(e) => handleStyleChange('textAlign', e.target.value)}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
        )}
      </div>
    </>
  );
}
