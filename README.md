# quiklist

The quickest command line checklist app for managing your tasks efficiently.

## Features

- **Fast CLI Interface**: Quick commands for adding, marking, and managing checklist items
- **Priority Support**: Assign priorities (HIGH, MEDIUM, LOW) with customizable visual styles
- **Deadline Tracking**: Set deadlines for tasks with flexible date formats
- **Sorting Options**: Sort items by priority, creation date, or deadline
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
   quiklist init
   # or
   ql init
   ```

2. **Create a new list** in your project directory:
   ```bash
   quiklist create
   ```

3. **Add items to your list**:
   ```bash
   quiklist add "Buy groceries"
   quiklist add "Finish project" --h
   quiklist add "Call mom" -d "13-09-2025"
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

<!-- - `quiklist --init` - Initialize quiklist configuration -->
- `quiklist|ql --help` - Show help information
- `quiklist|ql --version` - Show version information

### List Management

- `quiklist|ql create [options]` - Initialize a new list in current directory
  - `-d, --default` - Use default settings instead of interactive prompts

- `quiklist|ql delete-list` - Deletes the list at the path in which the command was called (with confirmation)

### Item Management (within a list directory)

- `quiklist|ql add [item_text...]` - Add new item to your local list (global by default if you're at a path where there is no quiklist created). By default, new items are assigned 'LOW' priority
  - `-m, --medium` - Set priority to MEDIUM
  - `--h, --high` - Set priority to HIGH
  - `-d, --deadline [deadline]` - Set deadline (format depends on config)
  - `-g, --global` - Add item to your global list

- `quiklist|ql mark` - Mark items as completed (interactive selection)

- `quiklist|ql show [options]` - Display list items
  - `-u, --unchecked` - Show only unchecked items

- `quiklist|ql delete` - Delete items from the list (interactive selection)

- `quiklist|ql edit` - Edit existing items (interactive selection)

## Configuration

quiklist stores configuration in `~/.config/quiklist/config.json` in the following format:

```jsonc
{
  "userName": "Udbhav Balaji",
  "dateFormat": "DD-MM-YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD" | "YYYY/MM/DD",
  "useEditorForUpdatingText": true | false,
  "lists": {
    // mapping of created lists to their data path
    "global": "path/to/your/data"
  }
}
```
<!---->
<!-- - **Date Format**: Choose your preferred date format -->
<!-- - **Priority Style**: Visual representation of priorities -->
<!--   - `*/**/***` - Asterisks (*, **, ***) -->
<!--   - `!/!!/!!!` - Exclamation marks (!, !!, !!!) -->
<!--   - `1/2/3` - Numbers (1, 2, 3) -->
<!--   - `none` - No priority indicators -->

## Examples

### Basic Workflow

```bash
# Initialize in a project
cd my-project
quiklist create # or ql create

# Add some tasks
quiklist add "Implement user authentication" # or ql add
quiklist add "Write unit tests" --h # or ql add
quiklist add "Update documentation" -m # or ql add
quiklist add "Deploy to production" -d "2024-02-01" # or ql add

# View all items
quiklist show # or ql show

# View only pending items
quiklist show -u # or ql show

# Mark completed tasks
quiklist mark # or ql mark

# Edit a task
quiklist edit # or ql edit
```

### Managing Lists across multiple projects & using the global quiklist

```bash
# working on project A
cd project-A
quiklist init
quiklist add "Project A task 1, v important" --h
quiklist add "Add documentation"

# working on project B
cd project-B
quiklist init
quiklist add "Project B task" -m
quiklist add "some other task" -d "04-05-2025"

# working with global quiklist

# Anywhere within home directory
quiklist-global add "Global task" -m
# or qlg add "Global task" -m
# or quiklist add "Global task" -m -g
# or ql add "Global task" -m -g
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
src/v2/
├── commands/       # CLI command implementations
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
