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

## Development Workflow

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/evmauth-ts.git`
3. Create a new branch: `git checkout -b my-feature`
4. Make your changes
5. Run `pnpm check` and `pnpm test` to ensure code is formatted and tests pass
6. Push to your fork and submit a pull request

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
