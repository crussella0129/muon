import React, { useEffect, useRef } from 'react';
import useCodegenStore from '../stores/codegenStore';

export default function CodegenModal() {
  const {
    open,
    status,
    progress,
    errors,
    buildOutput,
    closeModal,
  } = useCodegenStore();

  const termRef = useRef(null);

  // Auto-scroll terminal pane
  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, [buildOutput]);

  // Listen for IPC events
  useEffect(() => {
    if (!window.muonAPI) return;

    const cleanups = [
      window.muonAPI.onCodegenProgress((data) => {
        useCodegenStore.getState().setProgress(data);
      }),
      window.muonAPI.onCodegenOutput((text) => {
        useCodegenStore.getState().appendBuildOutput(text);
      }),
      window.muonAPI.onCodegenProcessExit(({ phase, code }) => {
        const store = useCodegenStore.getState();
        store.setRunningPid(null);
        if (code === 0 && phase === 'start') {
          store.appendBuildOutput('\n--- Process exited successfully ---\n');
          store.setStatus('success');
        } else if (code !== 0) {
          store.appendBuildOutput(`\n--- ${phase} exited with code ${code} ---\n`);
          store.setStatus('error');
        }
      }),
    ];

    return () => cleanups.forEach((fn) => fn());
  }, []);

  if (!open) return null;

  const pct = progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <div className="codegen-overlay" onClick={closeModal}>
      <div className="codegen-modal" onClick={(e) => e.stopPropagation()}>
        <div className="codegen-modal-header">
          <h3>Code Generation</h3>
          <button className="btn-remove" onClick={closeModal}>&times;</button>
        </div>

        <div className="codegen-modal-body">
          {/* Status display */}
          {status === 'idle' && (
            <p className="codegen-status">Ready to generate.</p>
          )}

          {(status === 'writing' || status === 'generating') && (
            <div className="codegen-progress-section">
              <p className="codegen-status">
                Writing files... ({progress.current}/{progress.total})
              </p>
              <div className="codegen-progress-bar">
                <div className="codegen-progress-fill" style={{ width: `${pct}%` }} />
              </div>
              {progress.file && (
                <p className="codegen-file-name">{progress.file}</p>
              )}
            </div>
          )}

          {status === 'success' && !buildOutput && (
            <p className="codegen-status codegen-success">
              All files written successfully!
            </p>
          )}

          {status === 'error' && errors.length > 0 && (
            <div className="codegen-errors">
              <p className="codegen-status codegen-error-text">Generation failed:</p>
              <ul>
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Terminal pane for build output */}
          {buildOutput && (
            <div className="codegen-terminal" ref={termRef}>
              <pre>{buildOutput}</pre>
            </div>
          )}

          {(status === 'building' || status === 'running') && (
            <p className="codegen-status">
              {status === 'building' ? 'Installing dependencies...' : 'Running app...'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
