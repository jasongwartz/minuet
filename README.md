# Minuet

Minuet is a programming environment for live-coding music in programming languages in the browser. Minuet has support for samples, software synths, effects, MIDI controller input, and playing external MIDI devices like analog synthesizers.

## Usage

You can start making music with code at: https://minuet.gwartz.me

## Developing

Minuet is built with the Web Audio API (via [Tone.js](https://tonejs.github.io/)) and the Web MIDI API (via [WEBMIDI.js](https://webmidijs.org/)).

### Architecture

- **Audio Engine ("Ostinato")**: Audio engine handling playback, scheduling, and effects
- **Language Plugins**: Execution environments for different programming languages
- **Monaco Editor**: Code editor with syntax highlighting and shortcuts
- **Sample Management**: Audio sample loading and caching system

### Supported Languages

- TypeScript: evaulated and executed directly in the browser
- Python: executed in WASM via [Pyodide](https://pyodide.org/)
- YAML: for basic compositions, write the desired data structure directly

### Getting Started

1. Clone the repository:

```bash
git clone https://github.com/jasongwartz/minuet
cd minuet
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

- `npm run test` - Run test suite

### Development Workflow

- **Code Style**: Follow the existing TypeScript/React patterns
- **Linting**: Run `npm run lint` before committing
- **Type Safety**: Ensure `npm run typecheck` passes
- **Testing**: Add tests for new features using Vitest, make sure all tests are passing with `npm test`

#### Adding New Language Support

Create a new language plugin in `src/lang/evaluate.ts` like so:

```typescript
export const PLUGINS = {
  // existing plugins...
  newlang: {
    name: 'New Language',
    render: async (contents: string) => {
      // Implementation goes here.
      // The "contents" argument will be the string of everything
      // in the developer pane in the editor. The render() function
      // should execute/evaluate the code and return a JavaScript object,
      // which will be validated against the schema.
    },
  },
}
```

### Sample Management

Audio samples are located in `public/samples/`. The development server includes a custom Vite plugin that:

- Serves samples from the public directory
- Handles audio file caching

To add new samples:

1. Place audio files in `public/samples/`
1. Samples will appear in the sidebar after reloading the page

## Contributing

Contributions are welcome! Please open an issue to get feedback on your idea before making a PR.

## Acknowledgments

- Built with [Tone.js](https://tonejs.github.io/) for Web Audio
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for code editing
- [Pyodide](https://pyodide.org/) for Python in the browser
- [shadcn/ui](https://ui.shadcn.com/) for UI components
