# README.md

# Next.js Monorepo

This is a monorepo project that contains two Next.js applications: **pdf** and **photo-converter**. Each application is designed to be deployed on its respective subdomain.

## Applications

### pdf

The **pdf** application is responsible for generating and managing PDF documents. It includes the following structure:

- **src/app/layout.tsx**: Defines the layout component for the PDF application.
- **src/app/page.tsx**: Exports the main page component for the PDF application.
- **src/components/index.ts**: Exports components used within the PDF application.
- **package.json**: Contains the configuration for the PDF application, including dependencies and scripts.
- **next.config.js**: Contains the Next.js configuration specific to the PDF application.

### photo-converter

The **photo-converter** application is responsible for converting images between different formats. It includes the following structure:

- **src/app/layout.tsx**: Defines the layout component for the Photo Converter application.
- **src/app/page.tsx**: Exports the main page component for the Photo Converter application.
- **src/components/index.ts**: Exports components used within the Photo Converter application.
- **package.json**: Contains the configuration for the Photo Converter application, including dependencies and scripts.
- **next.config.js**: Contains the Next.js configuration specific to the Photo Converter application.

## Shared Package

The **shared** package contains components and utilities that can be used across both applications. It includes:

- **src/index.ts**: Exports shared components or utilities.
- **package.json**: Contains the configuration for the shared package, including dependencies and scripts.
- **tsconfig.json**: TypeScript configuration for the shared package.

## Root Configuration

The root of the monorepo contains:

- **package.json**: The root configuration file for the monorepo, listing dependencies and scripts for the entire project.
- **tsconfig.json**: The root TypeScript configuration file for the monorepo, specifying compiler options and files to include in the compilation.

## Getting Started

To get started with the project, clone the repository and install the dependencies:

```bash
npm install
```

You can then run each application individually by navigating to the respective application directory and using:

```bash
npm run dev
```

## Deployment

Each application can be deployed on its respective subdomain. Ensure that the deployment configurations are set up correctly in the respective `next.config.js` files.

## License

This project is licensed under the MIT License.