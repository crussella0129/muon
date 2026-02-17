import useProjectStore from '../stores/projectStore';

export async function openProject() {
  if (!window.muonAPI) {
    console.warn('muonAPI not available (running outside Electron?)');
    return null;
  }

  const result = await window.muonAPI.openFile();
  if (!result) return null;

  try {
    const data = JSON.parse(result.content);
    return { path: result.path, data };
  } catch (err) {
    console.error('Failed to parse project file:', err);
    alert('Invalid project file. Expected valid JSON.');
    return null;
  }
}

export async function saveProject() {
  if (!window.muonAPI) {
    console.warn('muonAPI not available (running outside Electron?)');
    return false;
  }

  const store = useProjectStore.getState();
  let filePath = store.projectPath;

  if (!filePath) {
    filePath = await window.muonAPI.saveFileDialog(
      store.project.meta.name + '.muon.project.json'
    );
    if (!filePath) return false;
    store.setProjectPath(filePath);
  }

  const content = JSON.stringify(store.project, null, 2);
  await window.muonAPI.writeFile(filePath, content);
  store.markClean();
  return true;
}

export async function saveProjectAs() {
  if (!window.muonAPI) {
    console.warn('muonAPI not available (running outside Electron?)');
    return false;
  }

  const store = useProjectStore.getState();
  const filePath = await window.muonAPI.saveFileDialog(
    store.project.meta.name + '.muon.project.json'
  );
  if (!filePath) return false;

  store.setProjectPath(filePath);
  const content = JSON.stringify(store.project, null, 2);
  await window.muonAPI.writeFile(filePath, content);
  store.markClean();
  return true;
}
