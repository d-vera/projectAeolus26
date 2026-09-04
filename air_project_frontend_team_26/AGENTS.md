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

---

## Test Coverage Requirement

**Every new piece of functionality must be accompanied by tests.**

When adding or modifying functionality, the agent **must** write corresponding tests before considering the task complete:

1. **New components** — Create a `.spec.ts` file with tests covering rendering, inputs/outputs, user interactions, and edge cases.
2. **New services** — Write unit tests for all public methods, including success and error scenarios. Mock HTTP calls and dependencies.
3. **New pipes & directives** — Add tests verifying transformation logic or DOM behavior for all expected inputs (including edge cases and null/undefined).
4. **New guards & interceptors** — Test authorization logic, redirect behavior, and request/response manipulation.
5. **New utility functions/helpers** — Cover all branches, boundary conditions, and error handling.
6. **Modified existing functionality** — Update or add tests to cover the changed behavior. Do not leave modified code paths untested.

### Test Quality Standards

- Tests must be **meaningful** — avoid trivial assertions like `expect(component).toBeTruthy()` as the only test.
- Each test should have a **clear, descriptive name** explaining the expected behavior (e.g., `'should display error message when login fails'`).
- Tests must **run in isolation** — no dependency on execution order or shared mutable state.
- Mock external dependencies (HTTP, services, etc.) rather than relying on live integrations.

### Test Checklist

- [ ] Every new component has a corresponding `.spec.ts` file
- [ ] Every new service has unit tests for all public methods
- [ ] Every new pipe, directive, guard, or interceptor has tests
- [ ] Tests cover both happy paths and error/edge cases
- [ ] All tests pass (`npm test` / `ng test`)
- [ ] No skipped or commented-out tests (`fdescribe`, `fit`, `xdescribe`, `xit`)
