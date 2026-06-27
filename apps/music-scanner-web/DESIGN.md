# Design

## Theme

- **Color Scheme**: dark
- **Background**: `#0a0c10` (Dark obsidian/charcoal neutral)
- **Surface**: `#12161f` (Dark blue-tinted slate neutral for panels and containers)
- **Border**: `#222b3c` (Restrained, crisp border)
- **Typography**: `JetBrains Mono, Menlo, Monaco, Consolas, Courier New, monospace` (Terminal-inspired, precise, fixed-width typography)

## Palette

- **Neutral Ink**: `#f3f4f6` (High contrast off-white for primary text)
- **Muted Ink**: `#9ca3af` (Muted gray for labels and logs)
- **Primary Accent**: `#00e5ff` (Vibrant cyan for active state and primary actions)
- **Primary Hover**: `#00b8cc` (Cyan hover state)
- **Success Accent**: `#10b981` (Emerald green for connected/complete state)
- **Active Warning**: `#f59e0b` (Amber yellow for active steps in progress)
- **Error Accent**: `#ef4444` (Vibrant red for failed states)

## Design Tokens

### Typography

- **Heading 1**: `2.0rem` / `line-height: 1.2` / `font-weight: 700`
- **Heading 2**: `1.25rem` / `line-height: 1.4` / `font-weight: 600`
- **Body / Labels**: `0.875rem` / `line-height: 1.5`
- **System Logs**: `0.8125rem` / `line-height: 1.6`

### Spacing & Borders

- **Border Radius**: `8px` (Utilitarian, clean, not hyper-rounded)
- **Container Padding**: `1.5rem`
- **Component Gap**: `1.0rem`
- **Border Width**: `1px`

### Interactive States

- **Button Normal**: background: `#00e5ff`, color: `#05070a`, font-weight: bold
- **Button Hover**: background: `#00b8cc`
- **Button Focus**: outline: `2px solid #00e5ff`, outline-offset: `2px`
- **Button Disabled**: opacity: `0.4`, cursor: `not-allowed`
- **Input Normal**: background: `#07090d`, border: `1px solid #222b3c`, color: `#f3f4f6`
- **Input Focus**: border-color: `#00e5ff`

### Transitions

- **Hover/Interactive**: `150ms ease-out`
- **Step Change**: `250ms ease-out`
