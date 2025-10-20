# Invoice Editor

A production-ready React application for managing invoices with create, edit, finalize, and delete capabilities. Built with TypeScript, React-Bootstrap, and comprehensive test coverage.

## Features

- **Invoice Management**: Create, edit, view, and delete invoices
- **Smart Filtering**: Filter by status, customer, date range, and invoice number
- **Finalization Workflow**: Lock invoices with confirmation dialogs and immutability enforcement
- **Financial Accuracy**: Precise decimal handling, real-time total calculations
- **Accessibility**: 100% Lighthouse accessibility scores across all pages (WCAG 2.1 compliant)
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Type Safety**: Full TypeScript implementation with strict mode

## Quick Start

### Prerequisites

- Node.js 22.13.1 (see `.tool-versions`)
- Yarn 1.22.19
- API token (see Configuration section)

### Installation

```bash
# Install dependencies
yarn install

# Configure environment variables (required)
cp .env.template .env.local
# Edit .env.local and add your API token

# Start development server
yarn start
```

The app will open at `http://localhost:3000`.

### Configuration

Create `.env.local` from the template and add your API token:

```bash
# Copy template
cp .env.template .env.local
```

Then edit `.env.local`:

```bash
# API base URL
REACT_APP_API_BASE=https://jean-test-api.herokuapp.com

# API authentication token
# Find the token in the repository description
REACT_APP_API_TOKEN=your-api-token-here
```

> **Note**: `.env.local` is gitignored to prevent committing secrets. Never commit API tokens to version control.

## Available Scripts

```bash
yarn start          # Start development server
yarn build          # Build for production
yarn test           # Run test suite
yarn test:watch     # Run tests in watch mode
yarn lint           # Run ESLint
yarn format         # Format code with Prettier
yarn typecheck      # Run TypeScript type checking
yarn ci             # Run all checks (lint + typecheck + test)
```

## Architecture

### Project Structure

```
src/
├── app/
│   ├── features/           # Feature-based components
│   │   ├── InvoicesList/   # Invoice list with filters
│   │   ├── InvoiceShow/    # Invoice detail view
│   │   └── InvoiceForm/    # Create/edit invoice form
│   ├── App.tsx             # Main app component
│   └── index.tsx           # Entry point with ApiProvider
├── common/
│   ├── components/         # Shared components
│   ├── hooks/              # Custom React hooks
│   └── types/              # TypeScript type definitions
└── api/                    # API client setup
```

### Component Organization

- **Single-file components**: `ComponentName.tsx` (no folder)
- **Multi-file components**: `ComponentName/ComponentName.tsx` with `index.tsx` for exports only
- **Rule**: `index.tsx` is only for barrel exports, never for implementation

### Data Flow

- **API Layer**: OpenAPI-generated client via `useApi()` hook
- **State Management**: Colocated component state, no global state library
- **Data Fetching**: Custom hooks (`useInvoices`, `useFinalizeInvoice`) return `{ data, loading, error, refetch }`
- **Filtering**: JSON array format per Pennylane API spec:
  ```ts
  filter: [
    { field: 'date', operator: 'gteq', value: '2024-01-01' },
    { field: 'customer_id', operator: 'eq', value: '123' }
  ]
  ```

### Key Technical Decisions

1. **No Module Mocking**: Uses MSW (Mock Service Worker) for all network mocking instead of `jest.mock()` for realistic, portable test behavior
2. **Financial Accuracy**: Uses numeral.js library for all currency calculations and formatting to avoid floating-point errors, ensuring 2 decimal places precision
3. **Validation Strategy**: On-blur validation with inline errors, never loses user input
4. **Focus Management**: Declarative `autoFocus` prop instead of imperative `useRef` + `useEffect`
5. **Accessibility First**: Semantic HTML, ARIA attributes, keyboard navigation, focus management

## Testing

### Test Stack

- **Unit/Integration**: Jest + React Testing Library
- **Network Mocking**: MSW for both tests and development
- **Philosophy**: Test user interactions, not implementation details

### Test Strategy

- **User-Centric Testing**: Tests simulate actual user interactions (clicking buttons, filling forms, reading toast messages)
- **Component Integration Tests**: Test full component behavior with real user flows, not isolated hook logic
- **Comprehensive Error Coverage**: Each critical feature tests happy path + error scenarios (403, 404, 409, 500, network errors)
- **MSW for Network Mocking**: Realistic API simulation, no module mocks
- **Accessibility Testing**: Verifies ARIA labels, keyboard navigation, screen reader announcements
- **Current Coverage**: 122 tests passing across 6 test suites

### Running Tests

```bash
# Run all tests
yarn test

# Watch mode for development
yarn test:watch

# Run specific test file
yarn test InvoiceForm

# Run with coverage
yarn test --coverage
```

### Test Coverage by Feature

- **InvoicesList**: 43 tests
  - List display, sorting, filtering
  - Delete functionality (success + 5 error scenarios)
  - Finalize functionality (success + 5 error scenarios)
  - Accessibility (live regions, keyboard navigation)

- **InvoiceForm**: 23 tests
  - Form validation, calculations
  - Line item management
  - Customer/product selection

- **InvoiceShow**: 11 tests
  - Invoice detail display
  - PDF generation
  - Status badges

- **Utilities**: 45 tests
  - Currency calculations
  - Date formatting
  - API error parsing

## API Integration

### Using the API Client

```tsx
import { useApi } from 'api'

const MyComponent = () => {
  const api = useApi()

  const fetchInvoices = async () => {
    const response = await api.getInvoices()
    return response.data
  }

  // ...
}
```

### Filter Examples

```tsx
// Filter by date range
const filter = [
  { field: 'date', operator: 'gteq', value: '2024-01-01' },
  { field: 'date', operator: 'lteq', value: '2024-12-31' }
]

// Filter by customer
const filter = [
  { field: 'customer_id', operator: 'eq', value: customerId }
]

// Filter by status
const filter = [
  { field: 'finalized', operator: 'eq', value: true }
]

// Multiple filters (AND logic)
const response = await api.getInvoices(null, { filter: JSON.stringify(filter) })
```

### Finalization Rules

- Once `finalized: true`, invoices become immutable (except `paid` field)
- UI hides edit affordances for finalized invoices
- Delete attempts return 409 Conflict with user-friendly error
- Confirmation modal prevents accidental finalization

## Accessibility

### Achievements

- **100% Lighthouse scores** on all pages (list, detail, edit)
- **WCAG 2.1 Level AA** compliant
- **Keyboard navigation**: Full tab order, Enter/Escape support
- **Screen reader support**: Semantic HTML, ARIA labels, live regions
- **Focus management**: Automatic focus on modals, focus return after close

### Key Features

- Sortable tables with proper `aria-sort` attributes
- Form fields with explicit label associations
- Color contrast ratios exceeding 4.5:1
- Proper heading hierarchy (h1 → h2 → h3)
- Main landmark and semantic HTML5 structure

## Performance

- Optimistic updates for finalize/delete actions
- Debounced auto-save (future feature)
- Efficient re-renders with proper memoization
- Lazy loading for large invoice lists (future feature)

## Code Quality

- **TypeScript strict mode**: No `any` types
- **ESLint + Prettier**: Consistent code style
- **Pre-commit hooks**: Format, lint, typecheck, test
- **Component size**: Small, focused, single-responsibility
- **Error handling**: User-facing messages + dev console logs

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile Safari & Chrome

## Design Principles

This project follows Pennylane's design principles (see `CLAUDE.md`):

1. **Challenge the Basics**: Ship minimal viable features, iterate with evidence
2. **Empathize Relentlessly**: Design for stressed users, preserve input, clear errors
3. **Embrace Speed**: Small PRs, fast feedback, colocated logic
4. **Build Excitement**: Advocate long-term wins, keep backlog organized

## Documentation

- **PENNYLANE_CHALLENGE.md**: Original interview requirements
- **CLAUDE.md**: Development guidelines and architectural decisions
- **FUTURE_WORK.md**: Planned features and technical improvements

## Contributing

This is an interview project, but follows production standards:

1. Write tests for new features
2. Maintain accessibility standards
3. Update documentation
4. Run `yarn ci` before committing
5. Follow existing patterns and conventions

## License

MIT

## Support

For questions or issues, please contact the developer.

---

**Built with React, TypeScript, and attention to detail.**
