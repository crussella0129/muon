/**
 * Codegen string helpers and IPC channel utilities.
 * Pure functions — no I/O.
 */

export function toPascalCase(str) {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^[a-z]/, (c) => c.toUpperCase());
}

export function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

export function toVariableName(str) {
  const camel = toCamelCase(str.replace(/[^a-zA-Z0-9]/g, '-'));
  // Ensure it starts with a letter
  if (/^[0-9]/.test(camel)) return '_' + camel;
  return camel;
}

export function sanitizeChannelName(name) {
  return name.replace(/[^a-zA-Z0-9:_-]/g, '-').toLowerCase();
}

/**
 * Walk every window and collect all unique IPC channels.
 * Returns { emits: string[], listens: string[] }
 */
export function collectAllIpcChannels(windows) {
  const emits = new Set();
  const listens = new Set();

  for (const win of Object.values(windows)) {
    if (win.ipc) {
      (win.ipc.emits || []).forEach((ch) => emits.add(sanitizeChannelName(ch)));
      (win.ipc.listens || []).forEach((ch) => listens.add(sanitizeChannelName(ch)));
    }
  }

  return {
    emits: [...emits].sort(),
    listens: [...listens].sort(),
  };
}

/**
 * Collect navigation channels from edges.
 * Each navigation edge creates a "navigate:open-{targetId}" channel.
 */
export function collectNavigationChannels(edges) {
  return edges
    .filter((e) => e.type === 'navigation')
    .map((e) => `navigate:open-${e.target}`);
}

/**
 * Get unique list of all channels for preload exposure.
 */
export function collectAllChannels(windows, edges) {
  const ipc = collectAllIpcChannels(windows);
  const nav = collectNavigationChannels(edges);

  return {
    invoke: [...ipc.emits, ...nav].sort(),
    on: [...ipc.listens].sort(),
  };
}
