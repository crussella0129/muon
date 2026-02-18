/**
 * Codegen Orchestrator
 *
 * generateProject(model) -> Array<{ path: string, content: string }>
 * validateProject(model) -> { valid: boolean, errors: string[] }
 */
import { toPascalCase } from './helpers.js';
import { generatePackageJson } from './templates/packageJson.js';
import {
  generateForgeConfig,
  generateWebpackMainConfig,
  generateWebpackRendererConfig,
  generateWebpackPreloadConfig,
  generateWebpackRules,
} from './templates/forgeConfig.js';
import { generateMainProcess } from './templates/mainProcess.js';
import { generatePreload } from './templates/preload.js';
import {
  generateIndexHtml,
  generateIndexJsx,
  generateAppJsx,
  generateWindowComponent,
  generateIndexCss,
  generateSharedStore,
} from './templates/rendererFiles.js';

/**
 * Validate a project model before generation.
 * Returns { valid, errors }.
 */
export function validateProject(model) {
  const errors = [];

  if (!model) {
    errors.push('No project model provided.');
    return { valid: false, errors };
  }

  if (!model.meta || !model.meta.name) {
    errors.push('Project must have a meta.name.');
  }

  if (!model.windows || Object.keys(model.windows).length === 0) {
    errors.push('Project must have at least one window.');
  }

  if (!model.graph || !model.graph.nodes) {
    errors.push('Project must have a graph with nodes.');
  }

  // Check that every graph node has a corresponding window definition
  if (model.graph && model.graph.nodes && model.windows) {
    for (const node of model.graph.nodes) {
      if (!model.windows[node.id]) {
        errors.push(`Graph node "${node.id}" has no matching window definition.`);
      }
    }
  }

  // Check edge references
  if (model.graph && model.graph.edges && model.windows) {
    const windowIds = new Set(Object.keys(model.windows));
    for (const edge of model.graph.edges) {
      if (!windowIds.has(edge.source)) {
        errors.push(`Edge "${edge.id}" references unknown source window "${edge.source}".`);
      }
      if (!windowIds.has(edge.target)) {
        errors.push(`Edge "${edge.id}" references unknown target window "${edge.target}".`);
      }
    }
  }

  // Check for duplicate component IDs within each window's tree
  if (model.windows) {
    const windowIds = new Set(Object.keys(model.windows));

    for (const [winId, winDef] of Object.entries(model.windows)) {
      // Validate layoutMode
      if (winDef.layoutMode && winDef.layoutMode !== 'flow' && winDef.layoutMode !== 'free') {
        errors.push(`Window "${winId}" has invalid layoutMode: "${winDef.layoutMode}". Must be "flow" or "free".`);
      }

      if (winDef.children && winDef.children.length > 0) {
        const ids = new Set();
        const dupes = [];
        collectComponentIds(winDef.children, ids, dupes);
        for (const dup of dupes) {
          errors.push(`Window "${winId}" has duplicate component ID: "${dup}".`);
        }

        // Validate button onClick targets
        validateButtonTargets(winDef.children, winId, windowIds, errors);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

function collectComponentIds(children, ids, dupes) {
  for (const child of children) {
    if (ids.has(child.id)) {
      dupes.push(child.id);
    } else {
      ids.add(child.id);
    }
    if (child.children) {
      collectComponentIds(child.children, ids, dupes);
    }
  }
}

function validateButtonTargets(children, winId, windowIds, errors) {
  for (const child of children) {
    if (child.type === 'button' && child.props?.actions?.onClick?.type === 'navigate') {
      const target = child.props.actions.onClick.target;
      if (target && !windowIds.has(target)) {
        errors.push(`Button "${child.id}" in window "${winId}" navigates to unknown window "${target}".`);
      }
    }
    if (child.children) {
      validateButtonTargets(child.children, winId, windowIds, errors);
    }
  }
}

/**
 * Generate a complete Electron project from a Muon model.
 * Returns Array<{ path: string, content: string }>.
 */
export function generateProject(model) {
  const validation = validateProject(model);
  if (!validation.valid) {
    throw new Error('Invalid project:\n' + validation.errors.join('\n'));
  }

  const { meta, windows, graph } = model;
  const edges = graph.edges || [];
  const windowIds = Object.keys(windows);
  const stateEdges = edges.filter((e) => e.type === 'state');

  const files = [];

  // Root config files
  files.push({ path: 'package.json', content: generatePackageJson(meta) });
  files.push({ path: 'forge.config.js', content: generateForgeConfig() });
  files.push({ path: 'webpack.main.config.js', content: generateWebpackMainConfig() });
  files.push({ path: 'webpack.renderer.config.js', content: generateWebpackRendererConfig() });
  files.push({ path: 'webpack.preload.config.js', content: generateWebpackPreloadConfig() });
  files.push({ path: 'webpack.rules.js', content: generateWebpackRules() });

  // Electron main + preload
  files.push({ path: 'main.js', content: generateMainProcess(windows, edges) });
  files.push({ path: 'preload.js', content: generatePreload(windows, edges) });

  // Renderer: HTML, entry, App with routing
  files.push({ path: 'src/index.html', content: generateIndexHtml(meta) });
  files.push({ path: 'src/index.jsx', content: generateIndexJsx() });
  files.push({ path: 'src/App.jsx', content: generateAppJsx(windowIds) });

  // Per-window components
  for (const id of windowIds) {
    files.push({
      path: `src/windows/${toPascalCase(id)}Window.jsx`,
      content: generateWindowComponent(id, windows[id], edges),
    });
  }

  // Styles
  files.push({ path: 'src/styles/index.css', content: generateIndexCss() });

  // Shared store (only if state edges exist)
  if (stateEdges.length > 0) {
    const storeContent = generateSharedStore(stateEdges, windows);
    if (storeContent) {
      files.push({ path: 'src/stores/sharedStore.js', content: storeContent });
    }
  }

  // Re-importable project file
  files.push({
    path: 'muon.project.json',
    content: JSON.stringify(model, null, 2) + '\n',
  });

  return files;
}
