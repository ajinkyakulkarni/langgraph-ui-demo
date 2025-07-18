# Contributing to LangGraph Workflow Application

Thank you for your interest in contributing to the LangGraph Workflow Application! We welcome contributions from the community and are grateful for any help you can provide.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)
- [Feature Requests](#feature-requests)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please be respectful and professional in all interactions.

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Accept feedback gracefully

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/langgraph-workflow-app.git
   cd langgraph-workflow-app
   ```
3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/original-owner/langgraph-workflow-app.git
   ```
4. Create a new branch for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## How to Contribute

### Types of Contributions

- **Bug Fixes**: Fix issues reported in GitHub Issues
- **Features**: Implement new features or enhance existing ones
- **Documentation**: Improve documentation, add examples, fix typos
- **Tests**: Add missing tests or improve test coverage
- **Performance**: Optimize code for better performance
- **UI/UX**: Improve the user interface or user experience

### Contribution Process

1. Check existing issues and pull requests to avoid duplication
2. For major changes, open an issue first to discuss the proposal
3. Follow the development setup instructions
4. Make your changes following our coding standards
5. Write or update tests as needed
6. Update documentation if applicable
7. Submit a pull request

## Development Setup

### Backend Development

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Set up pre-commit hooks
pre-commit install

# Run tests
pytest

# Run linting
flake8 app/
black app/ --check
mypy app/
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run linting
npm run lint

# Run type checking
npm run type-check
```

## Coding Standards

### Python (Backend)

- Follow PEP 8 style guide
- Use Black for code formatting
- Use type hints where possible
- Maximum line length: 88 characters
- Write docstrings for all public functions and classes

```python
def calculate_score(items: List[Item], weights: Dict[str, float]) -> float:
    """
    Calculate weighted score for items.
    
    Args:
        items: List of items to score
        weights: Dictionary of weight factors
        
    Returns:
        Calculated weighted score
    """
    # Implementation here
```

### TypeScript (Frontend)

- Use ESLint configuration provided
- Use Prettier for formatting
- Prefer functional components with hooks
- Use proper TypeScript types (avoid `any`)
- Write JSDoc comments for complex functions

```typescript
interface UserProps {
  name: string;
  email: string;
  role: 'admin' | 'user';
}

/**
 * Display user information card
 */
const UserCard: React.FC<UserProps> = ({ name, email, role }) => {
  // Component implementation
};
```

### Commit Messages

Follow the Conventional Commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Example:
```
feat(agents): add new PDF export agent

Implemented a new agent that exports workflow results to PDF format.
The agent supports custom templates and formatting options.

Closes #123
```

## Testing Guidelines

### Backend Testing

- Write unit tests for all new functions
- Use pytest fixtures for common test data
- Aim for at least 80% code coverage
- Test edge cases and error conditions

```python
def test_calculate_score():
    items = [Item(value=10), Item(value=20)]
    weights = {"value": 0.5}
    
    score = calculate_score(items, weights)
    
    assert score == 15.0
```

### Frontend Testing

- Write unit tests for utility functions
- Use React Testing Library for component tests
- Test user interactions and accessibility
- Mock external dependencies

```typescript
describe('UserCard', () => {
  it('displays user information correctly', () => {
    const { getByText } = render(
      <UserCard name="John Doe" email="john@example.com" role="admin" />
    );
    
    expect(getByText('John Doe')).toBeInTheDocument();
    expect(getByText('admin')).toBeInTheDocument();
  });
});
```

## Submitting Changes

### Pull Request Process

1. Update your branch with the latest upstream changes:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. Push your changes to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

3. Create a Pull Request on GitHub

4. Fill out the PR template with:
   - Description of changes
   - Related issue numbers
   - Testing performed
   - Screenshots (if UI changes)

5. Wait for review and address feedback

### PR Review Criteria

- Code follows project standards
- Tests pass and coverage is maintained
- Documentation is updated
- No conflicts with main branch
- Clear and descriptive commit messages

## Reporting Issues

### Bug Reports

When reporting bugs, please include:

- Clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Environment details (OS, Python version, Node version)
- Screenshots or error logs if applicable

Use the bug report template when creating issues.

### Security Issues

For security vulnerabilities, please email security@yourproject.com instead of creating a public issue.

## Feature Requests

We welcome feature requests! Please:

- Check if the feature has already been requested
- Provide a clear use case
- Explain why this feature would be valuable
- Consider if you can help implement it

## Questions?

If you have questions about contributing:

1. Check the documentation
2. Search existing issues
3. Ask in GitHub Discussions
4. Join our community chat (if applicable)

Thank you for contributing to LangGraph Workflow Application! Your efforts help make this project better for everyone.