# Agent Rules

## Frontend Change Verification

**Always verify that frontend changes are reflected correctly.**

Before completing any task that modifies frontend code, the agent **must**:

1. **Build the project** — Run `ng build` (or `npm run build`) and confirm there are no compilation errors.
2. **Run tests** — Execute `npm test` (or `ng test`) to ensure all existing and new tests pass.
3. **Verify the change is visible** — Confirm the change actually takes effect in the application (e.g., check that components render, routes work, styles apply).
4. **Check for regressions** — Ensure no existing functionality is broken by the change.

### Quick Checklist

- [ ] Code compiles without errors (`ng build`)
- [ ] All unit tests pass (`npm test`)
- [ ] The change is observable in the running application
- [ ] No console errors or warnings introduced
- [ ] No regressions in related components
