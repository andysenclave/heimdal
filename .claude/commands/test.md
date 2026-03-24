Read the testing prompts before writing tests:
- docs/coding-prompts/08-how-to-unit-test-a-service.md for unit testing services (mock deps, test happy/edge/error paths)
- docs/coding-prompts/09-how-to-integration-test-an-endpoint.md for e2e endpoint tests (supertest, full HTTP lifecycle)

Follow the template structures. Each describe block = one method. Each it block = one behavior as a sentence. Tests must be independent with no shared mutable state.