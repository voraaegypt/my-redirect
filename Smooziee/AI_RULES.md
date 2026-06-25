# AI Development Rules & Tech Stack

## Tech Stack
*   **Framework**: React (Functional components with Hooks)
*   **Language**: TypeScript for type safety and better developer experience
*   **Styling**: Tailwind CSS for utility-first responsive design
*   **UI Components**: shadcn/ui (built on Radix UI) for accessible, high-quality components
*   **Icons**: Lucide React for a consistent and modern icon set
*   **Routing**: React Router for client-side navigation
*   **State Management**: React Context or local state (keep it simple)

## Development Rules

### 1. Component Architecture
*   **Location**: Place reusable UI components in `src/components/` and full-page views in `src/pages/`.
*   **File Size**: Aim for components under 100 lines. If a component grows too large, refactor it into smaller sub-components.
*   **Naming**: Use PascalCase for component files (e.g., `Button.tsx`) and camelCase for utility files.

### 2. UI & Styling
*   **shadcn/ui First**: Always check if a component exists in the shadcn/ui library before building a custom one.
*   **Tailwind CSS**: Use Tailwind classes for all custom styling, spacing, and layouts. Avoid inline styles or CSS modules unless absolutely necessary.
*   **Responsiveness**: Every UI element must be mobile-friendly using Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`).

### 3. Icons
*   **Lucide React**: Use `lucide-react` for all iconography to maintain visual consistency.

### 4. Routing
*   **Centralized Routes**: All application routes must be defined and managed within `src/App.tsx`.
*   **Index Page**: The default entry point for the application is `src/pages/Index.tsx`.

### 5. Best Practices
*   **Type Safety**: Define interfaces or types for all component props and data structures.
*   **Simplicity**: Prioritize simple, elegant solutions over complex abstractions.
*   **No Placeholders**: Always provide fully functional code. Avoid `TODO` comments or partial implementations.
*   **Error Handling**: Let errors bubble up naturally unless specific custom handling is requested.