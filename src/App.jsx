import React, { useEffect, useCallback } from 'react';
import { ReactFlowProvider } from 'reactflow';
import GraphView from './graph/GraphView';
import PropertiesPanel from './panels/PropertiesPanel';
import Toolbar from './panels/Toolbar';
import useProjectStore from './stores/projectStore';
import { openProject, saveProject, saveProjectAs } from './utils/fileIO';

export default function App() {
  const {
    selectedNodeId,
    setProjectPath,
    loadProject,
    resetProject,
    undo,
    redo,
  } = useProjectStore();

  const handleNewProject = useCallback(() => {
    resetProject();
  }, [resetProject]);

  const handleOpenProject = useCallback(async () => {
    const result = await openProject();
    if (result) {
      loadProject(result.data);
      setProjectPath(result.path);
    }
  }, [loadProject, setProjectPath]);

  const handleSave = useCallback(async () => {
    await saveProject();
  }, []);

  const handleSaveAs = useCallback(async () => {
    await saveProjectAs();
  }, []);

  // Register menu event listeners
  useEffect(() => {
    if (!window.muonAPI) return;

    const cleanups = [
      window.muonAPI.onMenuNewProject(handleNewProject),
      window.muonAPI.onMenuOpenProject(handleOpenProject),
      window.muonAPI.onMenuSave(handleSave),
      window.muonAPI.onMenuSaveAs(handleSaveAs),
      window.muonAPI.onMenuUndo(undo),
      window.muonAPI.onMenuRedo(redo),
    ];

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [handleNewProject, handleOpenProject, handleSave, handleSaveAs, undo, redo]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          handleSaveAs();
        } else {
          handleSave();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        handleOpenProject();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleNewProject();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleSaveAs, handleOpenProject, handleNewProject, undo, redo]);

  return (
    <div className="app">
      <Toolbar
        onNew={handleNewProject}
        onOpen={handleOpenProject}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
      />
      <div className="main-content">
        <ReactFlowProvider>
          <GraphView />
        </ReactFlowProvider>
        {selectedNodeId && <PropertiesPanel />}
      </div>
    </div>
  );
}
