# quiklist

The quickest command line checklist app for managing your tasks efficiently.

## Features

- **Fast CLI Interface**: Quick commands for adding, marking, and managing checklist items
- **Priority Support**: Assign priorities (HIGH, MEDIUM, LOW) with customizable visual styles
- **Deadline Tracking**: Set deadlines for tasks with flexible date formats
- **Sorting Options**: Sort items by priority, creation date, or deadline
- **Multiple Lists**: Create and manage multiple checklists
- **Interactive Prompts**: User-friendly prompts for better UX

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Install Globally

```bash
npm install -g quiklist
# or
yarn global add quiklist
```

### Build from Source

```bash
git clone https://github.com/udbhavbalaji/quiklist.git
cd quiklist
npm install
npm run build
npm link
```

## Quick Start

1. **Initialize quiklist** (first time only):
   ```bash
   quiklist --init
   # or
   ql --init
   ```

2. **Create a new list** in your project directory:
   ```bash
   quiklist init
   ```

3. **Add items to your list**:
   ```bash
   quiklist add "Buy groceries"
   quiklist add "Finish project" --high
   quiklist add "Call mom" --deadline "2024-01-15"
   ```

4. **View your list**:
   ```bash
   quiklist show
   ```

5. **Mark items as done**:
   ```bash
   quiklist mark
   ```

## Commands

### Global Commands

- `quiklist --init` - Initialize quiklist configuration
- `quiklist --help` - Show help information
- `quiklist --version` - Show version information

### List Management

- `quiklist init [options]` - Initialize a new list in current directory
  - `-d, --default` - Use default settings instead of interactive prompts

### Item Management (within a list directory)

- `quiklist add [item_text...]` - Add new item to the list
  - `--md` - Set priority to MEDIUM
  - `--high` - Set priority to HIGH
  - `-d, --deadline [deadline]` - Set deadline (format depends on config)

- `quiklist mark` - Mark items as completed (interactive selection)

- `quiklist show [options]` - Display list items
  - `-u, --unchecked` - Show only unchecked items

- `quiklist delete` - Delete items from the list (interactive selection)

- `quiklist edit` - Edit existing items (interactive selection)

- `quiklist delete-list` - Delete the entire list (with confirmation)

## Configuration

quiklist stores configuration in `~/.config/quiklist/config.json` including:

- **Date Format**: Choose your preferred date format
- **Priority Style**: Visual representation of priorities
  - `*/**/***` - Asterisks (*, **, ***)
  - `!/!!/!!!` - Exclamation marks (!, !!, !!!)
  - `1/2/3` - Numbers (1, 2, 3)
  - `none` - No priority indicators

## Examples

### Basic Workflow

```bash
# Initialize in a project
cd my-project
quiklist init

# Add some tasks
quiklist add "Implement user authentication"
quiklist add "Write unit tests" --high
quiklist add "Update documentation" --md
quiklist add "Deploy to production" --deadline "2024-02-01"

# View all items
quiklist show

# View only pending items
quiklist show --unchecked

# Mark completed tasks
quiklist mark

# Edit a task
quiklist edit
```

### Managing Multiple Lists

```bash
# Work list
cd work-project
quiklist init
quiklist add "Team meeting" --high
quiklist add "Code review"

# Personal list
cd personal-project
quiklist init
quiklist add "Grocery shopping"
quiklist add "Dentist appointment" --deadline "2024-01-20"
```

## Development

### Setup

```bash
npm install
npm run dev          # Run in development mode
npm run build        # Build the project
npm run typecheck    # Run TypeScript type checking
npm test            # Run tests
```

### Project Structure

```
src/v1/
├── commands/        # CLI command implementations
├── lib/            # Core library functions
├── types/          # TypeScript type definitions
└── index.ts        # Main application entry point
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite: `npm test`
6. Submit a pull request

## License

MIT - see [LICENSE](LICENSE) file for details

## Support

If you encounter any issues or have questions:

- Create an issue on [GitHub](https://github.com/udbhavbalaji/quiklist/issues)
- Check the [documentation](https://github.com/udbhavbalaji/quiklist/#readme) for more details