import React, { useEffect, useCallback } from 'react';
import { ReactFlowProvider } from 'reactflow';
import ScreenEditor from './editor/ScreenEditor';
import FlowView from './graph/FlowView';
import LeftSidebar from './panels/LeftSidebar';
import PropertiesPanel from './panels/PropertiesPanel';
import CodegenModal from './panels/CodegenModal';
import Toolbar from './panels/Toolbar';
import useProjectStore from './stores/projectStore';
import useCodegenStore from './stores/codegenStore';
import { openProject, saveProject, saveProjectAs } from './utils/fileIO';
import { generateProject, validateProject } from './codegen';

export default function App() {
  const {
    setProjectPath,
    loadProject,
    resetProject,
    undo,
    redo,
    removeComponent,
    clearComponentSelection,
  } = useProjectStore();

  const viewMode = useProjectStore((s) => s.viewMode);

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

  const handleGenerate = useCallback(async () => {
    const project = useProjectStore.getState().project;
    const cg = useCodegenStore.getState();

    // Validate
    const validation = validateProject(project);
    if (!validation.valid) {
      cg.openModal();
      cg.setErrors(validation.errors);
      return;
    }

    // Pick output directory
    if (!window.muonAPI) return;
    const dir = await window.muonAPI.selectDirectory();
    if (!dir) return;

    cg.setOutputDir(dir);
    cg.openModal();
    cg.setStatus('writing');

    try {
      const files = generateProject(project);
      const result = await window.muonAPI.generateFiles(dir, files);
      if (result.success) {
        cg.setStatus('success');
      }
    } catch (err) {
      cg.setErrors([err.message || 'Unknown error during generation.']);
    }
  }, []);

  const handleBuildRun = useCallback(async () => {
    const cg = useCodegenStore.getState();
    const dir = cg.outputDir;

    if (!dir) {
      await handleGenerate();
      const updatedDir = useCodegenStore.getState().outputDir;
      if (!updatedDir || useCodegenStore.getState().status === 'error') return;
      return handleBuildRunInDir(updatedDir);
    }

    return handleBuildRunInDir(dir);
  }, []);

  const handleBuildRunInDir = useCallback(async (dir) => {
    if (!window.muonAPI) return;
    const cg = useCodegenStore.getState();
    cg.openModal();
    cg.clearBuildOutput();
    cg.setStatus('building');

    const result = await window.muonAPI.buildAndRun(dir);
    if (result.error) {
      cg.setErrors([result.error]);
    } else if (result.pid) {
      cg.setRunningPid(result.pid);
      cg.setStatus('running');
    }
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
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        handleGenerate();
      }

      // Delete/Backspace removes selected component (editor mode only — let ReactFlow handle it in flow mode)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const state = useProjectStore.getState();
        if (state.viewMode === 'flow') return; // Let ReactFlow handle deletion
        if (state.selectedComponentId && state.selectedComponentWindowId) {
          const tag = e.target.tagName;
          if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
            e.stopPropagation();
            e.preventDefault();
            removeComponent(state.selectedComponentWindowId, state.selectedComponentId);
            clearComponentSelection();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleSaveAs, handleOpenProject, handleNewProject, handleGenerate, undo, redo, removeComponent, clearComponentSelection]);

  return (
    <div className="app">
      <Toolbar
        onNew={handleNewProject}
        onOpen={handleOpenProject}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onGenerate={handleGenerate}
        onBuildRun={handleBuildRun}
      />
      <div className="main-content">
        <LeftSidebar />
        {viewMode === 'editor' ? (
          <ScreenEditor />
        ) : (
          <ReactFlowProvider>
            <FlowView />
          </ReactFlowProvider>
        )}
        <PropertiesPanel />
      </div>
      <CodegenModal />
    </div>
  );
}
