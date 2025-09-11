# Contributing to EVMAuth

Thank you for your interest in contributing to EVMAuth! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Development Workflow](#development-workflow)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [Questions?](#questions)
- [License](#license)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By
participating, you are expected to uphold this code. Please report unacceptable behavior to:
[opensource@radiustech.xyz](mailto:opensource@radiustech.xyz).

## Reporting Issues

We use GitHub issues to track bugs, feature requests, and documentation improvements.

Please use our issue templates when creating a new issue:

- **Bug Report**: Use this template for reporting bugs or unexpected behavior
- **Feature Request**: Use this template for suggesting new features or enhancements
- **Documentation**: Use this template for reporting issues with documentation

These structured templates help us gather the information we need to address your issue efficiently.

## Prerequisites

- Node.js 18+ and pnpm
- [Foundry](https://book.getfoundry.sh/getting-started/installation) for running Anvil (local Ethereum node)

## Development Workflow

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/evmauth-ts.git`
3. Install dependencies: `pnpm install`
4. Create a new branch: `git checkout -b my-feature`
5. Make your changes
6. Run tests (see Testing section below)
7. Run `pnpm check` to ensure code passes type checking and linting
8. Push to your fork and submit a pull request

## Testing

This project uses integration tests that require a local Ethereum node. We use Anvil from Foundry for this purpose.

### Running Tests

1. **Start Anvil** in a separate terminal:
   ```bash
   anvil
   ```
   This starts a local Ethereum node on `http://127.0.0.1:8545`

2. **Run the tests** in another terminal:
   ```bash
   pnpm test
   ```

### Writing Tests

- Tests are located in `src/__tests__/`
- We use Vitest for testing
- Integration tests interact with real contracts deployed to Anvil
- Mock-based unit tests are discouraged as they don't provide value with Viem's type-safe contracts

### Test Coverage

Run coverage reports with:
```bash
pnpm test:coverage
```

## Available Scripts

- `pnpm build` - Build the TypeScript code
- `pnpm test` - Run tests (requires Anvil running)
- `pnpm test:coverage` - Run tests with coverage
- `pnpm check` - Run type checking and linting
- `pnpm format` - Format code with Biome
- `pnpm clean` - Clean build artifacts

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation only
- `style:` Code style changes
- `refactor:` Non-bug-fixing code changes
- `test:` Test updates
- `chore:` Build process updates

## Pull Requests

We have specialized templates for different types of contributions. When creating a pull request, choose the template that best fits your contribution:

- **Default Template**: For general changes
- **Feature Template**: For adding new features
- **Bugfix Template**: For bug fixes
- **Documentation Template**: For documentation updates

You can select a specific template by adding `?template=template_name.md` to your PR creation URL. For example:
`https://github.com/radiustech/evmauth-ts/compare/main...your-branch?template=feature.md`

All pull requests should include:

1. Clear title following conventional commits
2. Detailed description of changes
3. Reference related issues
4. Update documentation
5. Add tests
6. Update CHANGELOG.md
7. Ensure CI checks pass

## Questions?

If you have questions:

1. Check existing issues
2. Create a new issue with the `question` label
3. Ask in your PR if you're working on code

Thank you for your contributions!

## License

The **EVMAuth** TypeScript SDK is released under the MIT License. See the [LICENSE](LICENSE) file for details.
