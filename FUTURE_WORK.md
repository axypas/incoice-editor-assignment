# Future Work & Product Roadmap

## MVP Scope Decisions

### What We're Building (Core MVP)
1. **Invoice List** - View and filter existing invoices
2. **Create Invoice** - Basic form with line items and calculations
3. **Finalize Action** - Lock invoices to prevent edits
4. **Delete Action** - Remove draft invoices only
5. **Basic Validation** - Client-side form validation
6. **Auto-save Drafts** - Every 30 seconds with local storage backup

### What We're Intentionally Skipping (and why)
1. **Authentication/Authorization** - Assume single-user context for prototype
2. **Edit Existing Invoices** - Focus on create flow first (simpler state management)
3. **Payment Processing** - Complex integration, not core to invoice creation
4. **Email/PDF Export** - Requires template engine and external services
5. **Advanced Filtering** - Start with date/number only, add more based on usage
6. **Bulk Operations** - Single-invoice actions sufficient for MVP

## Prioritized Feature Roadmap

### 🎯 Phase 1: Foundation (Next 2-3 sprints)
*Focus: Core reliability and data integrity*

#### 1. Smart Invoice Numbering (High Impact, Medium Effort)
**Why:** Manual numbering causes duplicates and gaps, frustrating for accountants doing month-end reconciliation.

**User Story:** As an accountant, I want invoice numbers auto-generated sequentially so I never have duplicates or gaps in my records.

**Prototype Implementation:**
```typescript
// Simple auto-increment with year prefix
const generateInvoiceNumber = (lastInvoice: Invoice) => {
  const year = new Date().getFullYear()
  const sequence = extractSequence(lastInvoice.number) + 1
  return `INV-${year}-${sequence.toString().padStart(4, '0')}`
}
```

**What's Missing:**
- API endpoint for "next number" with atomic increment
- Configuration for number format patterns
- Support for multiple sequences (per customer/type)

**Complexity:** Medium - Requires database transactions for atomicity

---

#### 2. Edit Draft Invoices (High Impact, Low Effort)
**Why:** Users make mistakes and need to fix them before finalizing. Currently forced to delete and recreate.

**User Story:** As a user, I want to edit my draft invoices so I can fix mistakes without starting over.

**Prototype Implementation:**
- Add "Edit" button for draft invoices only
- Reuse create form component with pre-filled data
- Update endpoint already exists in API

**What's Missing:**
- Optimistic locking to handle concurrent edits
- Change history/audit log
- Undo/redo functionality

**Complexity:** Low - API supports this, just needs UI implementation

---

### 📊 Phase 2: Efficiency (Next 4-6 sprints)
*Focus: Reduce repetitive work and save time*

#### 3. Customer & Product Catalog (High Impact, High Effort)
**Why:** Users invoice the same customers with similar items repeatedly. Currently re-typing everything wastes 5-10 minutes per invoice.

**User Story:** As a user, I want to select from previous customers and products so I can create invoices faster.

**Prototype Implementation:**
```typescript
// Searchable dropdowns with recent items
const CustomerSelect = () => {
  const [recent, setRecent] = useLocalStorage('recentCustomers', [])
  return (
    <Autocomplete
      options={customers}
      recentOptions={recent.slice(0, 5)}
      onCreate={(customer) => api.createCustomer(customer)}
    />
  )
}
```

**What's Missing:**
- Full CRUD for customers/products entities
- Search/filter capabilities in API
- Favorite/pin frequently used items
- Import from CSV/accounting software

**Complexity:** High - New entities, relationships, and UI patterns

---

#### 4. Duplicate Invoice (Medium Impact, Low Effort)
**Why:** Many businesses have recurring clients with similar orders. Starting from a copy saves 70% of data entry time.

**User Story:** As a user, I want to duplicate an existing invoice as a starting point so I can quickly create similar invoices.

**Prototype Implementation:**
- Add "Duplicate" action to invoice rows
- Clone all fields except number and date
- Mark as draft automatically

**What's Missing:**
- API endpoint for deep clone with line items
- Smart field updates (next month's date, etc.)

**Complexity:** Low - Mostly client-side logic

---

### 💰 Phase 3: Financial Features (Next 6-9 sprints)
*Focus: Professional invoicing and compliance*

#### 5. PDF Generation & Preview (High Impact, High Effort)
**Why:** Customers expect professional PDF invoices. Currently users must manually recreate in Word/Excel.

**User Story:** As a user, I want to generate a PDF invoice so I can email professional documents to customers.

**Prototype Implementation:**
```typescript
// Client-side PDF generation
import { jsPDF } from 'jspdf'

const generatePDF = (invoice: Invoice) => {
  const doc = new jsPDF()
  // Template logic here
  doc.save(`invoice-${invoice.number}.pdf`)
}
```

**What's Missing:**
- Professional templates (multiple layouts)
- Company logo/branding upload
- Legal compliance per country (footer text, tax info)
- Server-side generation for consistency
- Email integration

**Complexity:** High - Template design, testing across formats

---

#### 6. Payment Tracking (High Impact, Medium Effort)
**Why:** Chasing payments is stressful. Users need to know what's paid, partial, or overdue at a glance.

**User Story:** As a user, I want to track payment status so I know which invoices need follow-up.

**Prototype Implementation:**
- Add payment status field (unpaid/partial/paid)
- Payment amount and date fields
- Visual indicators in list (color coding)
- Overdue calculation from due date

**What's Missing:**
- Payment gateway webhooks for auto-update
- Partial payment tracking with history
- Automated reminder emails
- Aging reports

**Complexity:** Medium - Requires payment data model and integrations

---

### 🚀 Phase 4: Scale & Automation (Future)
*Focus: Handle growth and reduce manual work*

#### 7. Recurring Invoices (Medium Impact, High Effort)
**Why:** Subscription businesses create the same invoices monthly. Manual creation leads to errors and forgotten invoices.

**Prototype Implementation:**
- Template system with scheduling rules
- Cron job for generation
- Preview before auto-send

**What's Missing:**
- Scheduling service infrastructure
- Template version management
- Pause/resume functionality
- Proration calculations

**Complexity:** High - Requires background jobs and scheduling

---

#### 8. Multi-Currency Support (Low Impact, High Effort)
**Why:** International businesses need accurate exchange rates and currency display.

**What's Missing:**
- Exchange rate API integration
- Currency configuration per customer
- Historical rate storage for reports
- Conversion at invoice vs payment time

**Complexity:** High - Financial accuracy critical

---

#### 9. Bulk Operations (Medium Impact, Medium Effort)
**Why:** Month-end processing requires finalizing many invoices at once.

**What's Missing:**
- Batch API endpoints
- Progress indicators for long operations
- Rollback on partial failure
- Background job processing

**Complexity:** Medium - UI and API changes needed

---

#### 10. Advanced Analytics (Low Impact, Medium Effort)
**Why:** Business owners need insights on revenue trends, customer value, and product performance.

**What's Missing:**
- Data aggregation endpoints
- Chart/visualization library
- Export to Excel/CSV
- Scheduled reports

**Complexity:** Medium - Requires data warehouse approach

---

## Technical Debt & Infrastructure

### Immediate Needs
1. **Test Coverage** - Add Jest tests for financial calculations
2. **Error Boundaries** - Graceful failure handling
3. **Performance Monitoring** - Track API response times
4. **Accessibility Audit** - WCAG 2.1 AA compliance

### Long-term Architecture
1. **State Management** - Consider Redux/Zustand for complex state
2. **API Caching** - React Query for optimistic updates
3. **Component Library** - Storybook for consistent UI
4. **E2E Testing** - Playwright for critical paths

## Success Metrics

### MVP Success Criteria
- ✅ Create 10 invoices without errors
- ✅ Filter and find invoices quickly
- ✅ No data loss (auto-save works)
- ✅ Clear validation messages

### Future Success Metrics
- 📈 Time to create invoice < 2 minutes
- 📈 Zero duplicate invoice numbers
- 📈 95% of invoices created from templates/copies
- 📈 < 1% error rate on submissions

## Risk Assessment

### High Risk
- **Data Loss** - Mitigated by auto-save and local storage
- **Calculation Errors** - Mitigated by decimal.js library
- **Concurrent Edits** - Needs optimistic locking

### Medium Risk
- **Performance at Scale** - Need pagination strategy
- **Browser Compatibility** - Test on IE11/Safari
- **API Rate Limits** - Implement request throttling

### Low Risk
- **Feature Creep** - Strong MVP scope definition
- **Tech Stack Changes** - Using stable, proven libraries

## Conclusion

This roadmap prioritizes features that:
1. **Reduce accountant stress** (auto-save, validation)
2. **Save time** (catalogs, duplication)
3. **Prevent errors** (auto-numbering, finalization)
4. **Scale gradually** (simple → complex)

Each phase builds on the previous, allowing for user feedback and course correction. The MVP focuses on core invoice creation, while future phases add efficiency and automation based on real usage patterns.