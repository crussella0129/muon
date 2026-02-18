import { create } from 'zustand';

const useCodegenStore = create((set, get) => ({
  // Modal visibility
  open: false,

  // 'idle' | 'generating' | 'writing' | 'success' | 'error' | 'building' | 'running'
  status: 'idle',

  // Progress for file writing
  progress: { current: 0, total: 0, file: '' },

  // Error messages
  errors: [],

  // Output directory chosen by user
  outputDir: null,

  // Terminal output from build & run
  buildOutput: '',

  // PID of running child process
  runningPid: null,

  // Actions
  openModal: () => set({ open: true }),
  closeModal: () => {
    const { status } = get();
    // Don't close while writing or building
    if (status === 'writing' || status === 'building') return;
    set({ open: false, status: 'idle', progress: { current: 0, total: 0, file: '' }, errors: [], buildOutput: '' });
  },

  setStatus: (status) => set({ status }),
  setProgress: (progress) => set({ progress }),
  setErrors: (errors) => set({ errors, status: 'error' }),
  setOutputDir: (outputDir) => set({ outputDir }),

  appendBuildOutput: (text) =>
    set((s) => ({ buildOutput: s.buildOutput + text })),

  clearBuildOutput: () => set({ buildOutput: '' }),
  setRunningPid: (pid) => set({ runningPid: pid }),

  reset: () =>
    set({
      status: 'idle',
      progress: { current: 0, total: 0, file: '' },
      errors: [],
      buildOutput: '',
      runningPid: null,
    }),
}));

export default useCodegenStore;
