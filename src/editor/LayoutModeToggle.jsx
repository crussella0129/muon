import React from 'react';
import useProjectStore from '../stores/projectStore';

export default function LayoutModeToggle({ screenId }) {
  const layoutMode = useProjectStore(
    (s) => s.project.windows[screenId]?.layoutMode || 'flow'
  );
  const updateWindowConfig = useProjectStore((s) => s.updateWindowConfig);

  return (
    <div className="layout-mode-toggle">
      <button
        className={layoutMode === 'flow' ? 'active' : ''}
        onClick={() => updateWindowConfig(screenId, { layoutMode: 'flow' })}
      >
        Flow
      </button>
      <button
        className={layoutMode === 'free' ? 'active' : ''}
        onClick={() => updateWindowConfig(screenId, { layoutMode: 'free' })}
      >
        Free
      </button>
    </div>
  );
}
