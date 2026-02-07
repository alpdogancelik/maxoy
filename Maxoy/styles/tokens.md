# Design Tokens

Design tokens live in `styles/tokens.scss` and are exposed as CSS variables.

Core categories:
- Colors: `--color-primary`, `--color-secondary`, `--color-surface`, `--color-text`
- Radius: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-pill`
- Shadows: `--shadow-sm`, `--shadow-md`, `--shadow-lg`
- Spacing: `--space-1` … `--space-8`
- Type scale: `--font-size-xs` … `--font-size-xxl`

Use the existing aliases when possible:
- `--primary-color`, `--secondary-color`, `--surface-color`, `--muted`

Example usage:

```scss
.button {
  min-height: var(--btn-height);
  border-radius: var(--radius-pill);
  background: var(--secondary-color);
  box-shadow: var(--shadow-sm);
  padding: var(--space-2) var(--space-4);
}
```
