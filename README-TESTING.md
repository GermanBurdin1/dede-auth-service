# Testing Strategy for Auth Service

## Overview

This document outlines the testing strategy for the auth-service, including unit tests, integration tests, and e2e tests.

## Test Types

### 1. Unit Tests ✅ (Implemented)

**Purpose**: Test individual functions/methods in isolation
**Coverage**: Business logic, error handling, edge cases
**Speed**: Fast execution
**Dependencies**: Mocked

**Files**:
- `src/auth.controller.spec.ts` - Tests for AuthController
- `src/users/users.service.spec.ts` - Tests for UsersService

**Key Test Cases**:
- User registration (success/failure scenarios)
- User login (valid/invalid credentials)
- Email confirmation logic
- Password hashing
- Role management
- Error handling

**Run Command**:
```bash
npm test
npm run test:watch  # Watch mode
npm run test:cov    # With coverage
```

### 2. Integration Tests 🔄 (Recommended)

**Purpose**: Test interaction between multiple components
**Coverage**: Service interactions, database operations
**Speed**: Medium execution
**Dependencies**: Real database (test instance)

**Recommended Tests**:
- Full registration flow (controller → service → database)
- Email confirmation flow
- User authentication flow
- Database migrations
- Mail service integration

**Implementation**:
```bash
# Create integration test file
src/auth.integration.spec.ts
src/users/users.integration.spec.ts
```

**Setup**:
- Use test database
- Mock external services (SMTP)
- Clean database between tests

### 3. E2E Tests 🔄 (Recommended)

**Purpose**: Test complete user workflows
**Coverage**: Full application stack
**Speed**: Slow execution
**Dependencies**: Real services

**Recommended Test Scenarios**:
- Complete user registration flow
- Email confirmation workflow
- Login/logout process
- Password reset flow
- User profile management

**Implementation**:
```bash
# Use existing e2e setup
npm run test:e2e
```

### 4. API Tests 🔄 (Recommended)

**Purpose**: Test HTTP endpoints
**Coverage**: Request/response validation
**Speed**: Medium execution
**Dependencies**: Mocked services

**Recommended Tests**:
- HTTP status codes
- Request validation
- Response format
- Error responses
- Authentication headers

## Current Test Coverage

### AuthController Tests ✅
- ✅ User registration (success/failure)
- ✅ User login (valid/invalid credentials)
- ✅ Email confirmation
- ✅ Email resend functionality
- ✅ Email existence check
- ✅ Error handling

### UsersService Tests ✅
- ✅ User creation and updates
- ✅ Email confirmation logic
- ✅ Email status checking
- ✅ Registration statistics
- ✅ Role management
- ✅ Database error handling

## Test Best Practices

### 1. Test Structure (AAA Pattern)
```typescript
describe('MethodName', () => {
  it('should do something when condition', async () => {
    // Arrange - Setup test data and mocks
    const mockData = { ... };
    service.method.mockResolvedValue(mockData);

    // Act - Execute the method
    const result = await controller.method(params);

    // Assert - Verify the result
    expect(result).toEqual(expected);
    expect(service.method).toHaveBeenCalledWith(params);
  });
});
```

### 2. Mocking Strategy
```typescript
// Mock external dependencies
jest.mock('bcrypt');
jest.mock('nodemailer');

// Mock database operations
const mockRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  query: jest.fn(),
};
```

### 3. Test Data Management
```typescript
// Use factory functions for test data
const createMockUser = (overrides = {}) => ({
  id_users: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  password: 'hashedPassword123',
  roles: ['student'],
  name: 'John',
  surname: 'Doe',
  is_active: true,
  is_email_confirmed: false,
  created_at: new Date(),
  ...overrides,
});
```

## Recommended Next Steps

### 1. Integration Tests (High Priority)
```typescript
// src/auth.integration.spec.ts
describe('Auth Integration', () => {
  it('should register user and send confirmation email', async () => {
    // Test complete registration flow
  });

  it('should confirm email and update user status', async () => {
    // Test email confirmation flow
  });
});
```

### 2. API Tests (Medium Priority)
```typescript
// src/auth.api.spec.ts
describe('Auth API', () => {
  it('should return 201 on successful registration', async () => {
    // Test HTTP response
  });

  it('should return 400 on invalid email format', async () => {
    // Test validation
  });
});
```

### 3. E2E Tests (Low Priority)
```typescript
// test/auth.e2e-spec.ts
describe('Auth E2E', () => {
  it('should complete full registration workflow', async () => {
    // Test complete user journey
  });
});
```

## Test Configuration

### Jest Configuration
```json
{
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
```

### Environment Variables for Testing
```env
# .env.test
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=test_user
DB_PASSWORD=test_password
DB_NAME=lang_app_auth_test
SMTP_USER=test@example.com
SMTP_PASS=test_password
```

## Running Tests

```bash
# Unit tests
npm test

# Unit tests with coverage
npm run test:cov

# Unit tests in watch mode
npm run test:watch

# E2E tests
npm run test:e2e

# All tests
npm run test && npm run test:e2e
```

## Coverage Goals

- **Unit Tests**: 90%+ coverage
- **Integration Tests**: 80%+ coverage
- **E2E Tests**: 70%+ coverage
- **Overall**: 85%+ coverage

## Continuous Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:cov
      - run: npm run test:e2e
```

## Benefits of Comprehensive Testing

1. **Confidence**: Safe refactoring and deployments
2. **Documentation**: Tests serve as living documentation
3. **Bug Prevention**: Catch issues early
4. **Regression Testing**: Ensure new changes don't break existing functionality
5. **Code Quality**: Better design and architecture

## Conclusion

The current unit test coverage provides a solid foundation. The recommended next steps are:

1. **Integration Tests** - Test real database interactions
2. **API Tests** - Test HTTP layer
3. **E2E Tests** - Test complete user workflows

This layered approach ensures comprehensive coverage and confidence in the codebase. 