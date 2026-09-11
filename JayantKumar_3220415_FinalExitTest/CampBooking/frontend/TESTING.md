# Frontend Testing Documentation

## Overview

This CampBooking frontend project uses **Vitest** and **React Testing Library** for comprehensive testing. The testing setup includes unit tests, component tests, and integration tests.

## Testing Stack

- **Vitest**: Fast unit test framework (Vite-native alternative to Jest)
- **React Testing Library**: Testing utilities focused on user behavior
- **@testing-library/jest-dom**: Custom Jest matchers for DOM assertions
- **@testing-library/user-event**: Realistic user interaction simulation
- **jsdom**: Browser environment simulation for Node.js

## Test Structure

```
frontend/src/
├── __tests__/                     # Integration tests
│   └── App.integration.test.jsx
├── components/
│   └── Auth/
│       └── __tests__/            # Component unit tests
│           └── ProtectedRoute.test.jsx
├── pages/
│   └── __tests__/                # Page component tests
│       └── Login.test.jsx
├── services/
│   └── __tests__/                # Service layer tests
│       └── authService.test.js
├── store/
│   └── __tests__/                # Redux slice tests
│       └── authSlice.test.js
└── test/
    ├── setup.js                  # Test configuration
    └── test-utils.jsx            # Custom render helpers
```

## Running Tests

### Install Dependencies (if not done)
```bash
cd frontend
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test -- --watch
```

### Run Tests with UI
```bash
npm run test:ui
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test -- Login.test.jsx
```

### Run Tests Matching Pattern
```bash
npm test -- --grep "login"
```

## Test Utilities

### Custom Render Helper

Use `renderWithProviders` for components that need Redux/Router context:

```javascript
import { renderWithProviders, mockAuthenticatedState } from '../test/test-utils'

test('should render authenticated user component', () => {
  renderWithProviders(<UserProfile />, {
    preloadedState: mockAuthenticatedState
  })
  
  expect(screen.getByText('Welcome back!')).toBeInTheDocument()
})
```

### Mock States Available

- `mockAuthenticatedState` - Logged in regular user
- `mockAdminState` - Logged in admin user  
- `mockUnauthenticatedState` - Not logged in

### Example Test Patterns

#### Component Testing
```javascript
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/test-utils'

test('should handle form submission', async () => {
  const user = userEvent.setup()
  renderWithProviders(<LoginForm />)
  
  await user.type(screen.getByLabelText(/email/i), 'test@example.com')
  await user.click(screen.getByRole('button', { name: /submit/i }))
  
  expect(screen.getByText('Success!')).toBeInTheDocument()
})
```

#### Service Testing
```javascript
import { vi } from 'vitest'

// Mock API calls
vi.mock('../api', () => ({
  default: {
    post: vi.fn(() => Promise.resolve({ data: mockResponse }))
  }
}))

test('should call API with correct data', async () => {
  await authService.login(credentials)
  expect(mockApi.post).toHaveBeenCalledWith('/auth/login', credentials)
})
```

#### Redux Testing
```javascript
test('should update state on action', () => {
  const store = createTestStore(initialState)
  
  store.dispatch(login.fulfilled(loginPayload))
  
  expect(store.getState().auth.isAuthenticated).toBe(true)
})
```

## Test Coverage

Current test coverage focuses on:

✅ **Authentication Flow**
- Login/register forms
- Protected route guards  
- Auth service methods
- Auth Redux state

✅ **Component Rendering**
- Basic component structure
- Conditional rendering based on auth state
- User interaction handling

✅ **Service Layer**
- API call formatting
- Local storage operations
- Error handling

✅ **State Management**
- Redux action creators
- State updates
- Cross-slice interactions

## Writing New Tests

### 1. Component Tests
- Test user-visible behavior, not implementation
- Use semantic queries (`getByRole`, `getByLabelText`)
- Test user interactions with `userEvent`
- Mock external dependencies

### 2. Service Tests  
- Mock HTTP calls
- Test error scenarios
- Verify API contracts
- Test data transformations

### 3. Integration Tests
- Test complete user workflows
- Mock minimal external dependencies
- Focus on feature completeness
- Test routing and navigation

## Best Practices

- **Arrange-Act-Assert**: Structure tests clearly
- **User-centric**: Test what users see/do, not internal state
- **Mock external**: Mock API calls, don't test external services
- **Descriptive names**: Test names should explain the scenario
- **One concept**: Each test should verify one behavior
- **Clean up**: Use `beforeEach`/`afterEach` for test isolation

## Debugging Tests

### View Rendered Output
```javascript
import { screen } from '@testing-library/react'

test('debug test', () => {
  render(<Component />)
  screen.debug() // Prints current DOM
})
```

### Wait for Async Updates
```javascript
import { waitFor } from '@testing-library/react'

test('async test', async () => {
  // ... trigger async action
  
  await waitFor(() => {
    expect(screen.getByText('Loaded!')).toBeInTheDocument()
  })
})
```

### Mock Console
```javascript
// Suppress expected console errors in tests
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
```

## CI/CD Integration

Tests run automatically in CI pipeline:
- All tests must pass before deployment
- Coverage reports generated
- Failed tests block merges

For more details, see the main project [ARCHITECTURE.md](../../ARCHITECTURE.md#frontend-testing-strategy).