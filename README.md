# Our Africa - Desktop Learning Management System

Our Africa is a powerful, offline-first Learning Management System (LMS) built as a cross-platform desktop application. Designed to provide accessible education in environments with limited internet connectivity, it enables users to access educational content, track progress, and earn certificates entirely offline.

## 🌟 Features

### 📚 **Offline Learning**

- Complete offline functionality - no internet required after installation
- Local SQLite database for data persistence
- Import learning modules from JSON files or URLs

### 👥 **User Management**

- Multi-user support with secure authentication
- User switching without data loss
- Profile management and avatars

### 📖 **Module-Based Learning**

- Structured learning modules with lessons and quizzes
- Rich content support including text, images, and videos
- Interactive quizzes with immediate feedback
- Module difficulty levels and tagging system

### 📊 **Progress Tracking**

- Real-time progress tracking for each user
- Time spent tracking for lessons
- Module completion status and percentages
- Detailed learning analytics

### 🏆 **Certification System**

- Automatic certificate generation upon module completion
- PDF export capabilities
- Certificate verification system
- Achievement tracking

### 🎨 **Modern Interface**

- Clean, intuitive user interface built with React
- Dark/light theme support
- Responsive design optimized for desktop use
- Accessibility features

## 🛠 Tech Stack

This application is built using modern web technologies:

- **Framework**: [Electron](https://www.electronjs.org/) with [Electron-Vite](https://electron-vite.org/)
- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite3 with local storage
- **Authentication**: bcrypt for secure password hashing
- **Build System**: Vite for fast development and optimized builds
- **Package Manager**: pnpm (recommended) or npm

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18.0 or higher) - [Download here](https://nodejs.org/)
- **pnpm** (recommended) or npm
  ```bash
  # Install pnpm globally
  npm install -g pnpm
  ```

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/dr-33-m/OurAfrica.git
cd OurAfrica
```

### 2. Install Dependencies

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install
```

### 3. Start Development Server

```bash
# Using pnpm
pnpm dev

# Or using npm
npm run dev
```

The application will launch in development mode with hot-reload enabled.

## 🔧 Development

### Available Scripts

- **`pnpm dev`** - Start development server with hot reload
- **`pnpm build`** - Build the application for production
- **`pnpm start`** - Preview the built application
- **`pnpm lint`** - Run ESLint to check code quality
- **`pnpm format`** - Format code with Prettier
- **`pnpm typecheck`** - Run TypeScript type checking

### Development Workflow

1. **Start the development server**: `pnpm dev`
2. **Make your changes** in the `src/` directory
3. **Test your changes** - the app will hot-reload automatically
4. **Run type checking**: `pnpm typecheck`
5. **Format your code**: `pnpm format`
6. **Lint your code**: `pnpm lint`

### Project Structure

```
our-africa/
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.ts       # Main process entry point
│   │   ├── database/      # Database management
│   │   └── types.ts       # Type definitions
│   ├── preload/           # Preload scripts
│   │   └── index.ts       # IPC bridge
│   └── renderer/          # React frontend
│       ├── src/
│       │   ├── components/    # Reusable components
│       │   ├── pages/         # Page components
│       │   ├── hooks/         # Custom React hooks
│       │   ├── services/      # Business logic
│       │   ├── types/         # TypeScript types
│       │   └── utils/         # Utility functions
│       └── index.html     # HTML entry point
├── build/                 # Build resources (icons, etc.)
├── electron-builder.yml   # Electron Builder configuration
└── package.json          # Project dependencies and scripts
```

## 📦 Building for Distribution

### Build for All Platforms

```bash
pnpm build
```

### Platform-Specific Builds

#### Windows

```bash
pnpm build:win
```

Creates: `our-africa-1.0.0-setup.exe`

#### macOS

```bash
pnpm build:mac
```

Creates: `our-africa-1.0.0.dmg`

#### Linux

```bash
pnpm build:linux
```

Creates: `our-africa-1.0.0.AppImage`, `.deb`, and `.snap` packages

### Distribution

After building, you'll find the installers in the `dist/` directory. For distribution:

- **Share the single installer file** (`.exe`, `.dmg`, or `.AppImage`)
- **No additional files needed** - everything is bundled in the installer
- **Users simply download and install** like any other desktop application

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/OurAfrica.git
   ```
3. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes** following our coding standards
5. **Test your changes** thoroughly
6. **Commit your changes** with clear commit messages
7. **Push to your fork** and create a Pull Request

### Coding Standards

- **TypeScript**: All new code should be written in TypeScript
- **ESLint**: Follow the existing ESLint configuration
- **Prettier**: Format code using Prettier
- **Commits**: Use conventional commit messages
- **Testing**: Add tests for new features when applicable

### Pull Request Process

1. Ensure your code passes all linting and type checks
2. Update documentation if you're adding new features
3. Describe your changes clearly in the PR description
4. Link any related issues
5. Wait for review and address any feedback

### Development Guidelines

- **Keep components small and focused**
- **Use TypeScript types consistently**
- **Follow React best practices**
- **Write self-documenting code**
- **Add comments for complex logic**
- **Ensure cross-platform compatibility**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Issues and Support

- **Bug Reports**: [Create an issue](https://github.com/dr-33-m/OurAfrica/issues) with detailed reproduction steps
- **Feature Requests**: [Open a discussion](https://github.com/dr-33-m/OurAfrica/discussions) to propose new features
- **Questions**: Check existing issues or start a new discussion

## 🙏 Acknowledgments

- Built with [Electron-Vite](https://electron-vite.org/) for modern development experience
- Icons and UI components inspired by modern design principles
- Special thanks to all contributors and the open-source community

---

**Our Africa** - Bringing quality education to everyone, everywhere, offline.
