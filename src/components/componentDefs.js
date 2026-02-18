/**
 * Component type definitions and factory for the visual builder.
 */

export const COMPONENT_TYPES = {
  heading: {
    type: 'heading',
    label: 'Heading',
    icon: 'H',
    defaultProps: { text: 'Heading', level: 1 },
    defaultStyle: { color: '#000000' },
    hasChildren: false,
  },
  paragraph: {
    type: 'paragraph',
    label: 'Paragraph',
    icon: 'P',
    defaultProps: { text: 'Paragraph text goes here.' },
    defaultStyle: { color: '#333333' },
    hasChildren: false,
  },
  button: {
    type: 'button',
    label: 'Button',
    icon: 'B',
    defaultProps: { text: 'Button', actions: {} },
    defaultStyle: {
      backgroundColor: '#3b82f6',
      color: '#ffffff',
      padding: '8px 16px',
      borderRadius: '4px',
    },
    hasChildren: false,
  },
  textInput: {
    type: 'textInput',
    label: 'Text Input',
    icon: 'I',
    defaultProps: { placeholder: 'Enter text...', label: 'Label' },
    defaultStyle: {},
    hasChildren: false,
  },
  image: {
    type: 'image',
    label: 'Image',
    icon: 'Img',
    defaultProps: { alt: 'Image', width: 200, height: 150 },
    defaultStyle: { backgroundColor: '#e2e8f0' },
    hasChildren: false,
  },
  divider: {
    type: 'divider',
    label: 'Divider',
    icon: '—',
    defaultProps: {},
    defaultStyle: { borderColor: '#e2e8f0', margin: '8px 0' },
    hasChildren: false,
  },
  container: {
    type: 'container',
    label: 'Container',
    icon: '[ ]',
    defaultProps: { direction: 'column' },
    defaultStyle: { padding: '8px', gap: '8px' },
    hasChildren: true,
  },
};

/**
 * Create a new component instance from a type key.
 */
export function createComponent(type) {
  const def = COMPONENT_TYPES[type];
  if (!def) throw new Error(`Unknown component type: ${type}`);

  return {
    id: `comp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: def.type,
    props: { ...def.defaultProps },
    style: { ...def.defaultStyle },
    children: def.hasChildren ? [] : undefined,
  };
}
