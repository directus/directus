# Examples Directory

**These are EXAMPLES from the proffbemanning-dashboard project.**

## Purpose

This directory contains real-world patterns and designs that were used in production. They're included as:
- Learning resources
- Starting points for similar projects
- Reference implementations

## What's Included

### Dashboard Patterns (`dashboard/`)
Production-tested component patterns for dashboard UIs:
- Data tables with sorting/filtering
- Card layouts (stats, KPIs, activity feeds)
- Navigation components
- Form patterns

### Design Systems (`design-systems/`)
Complete design system documentation:
- `ASYMMETRIC_LAYOUT_SYSTEM.md` - Unique layout approach
- `PREMIUM_DARK_DESIGN_SYSTEM.md` - Dark mode design tokens

## How to Use

### Option 1: Use as Learning Resources
Keep examples, reference them when building similar features.

### Option 2: Adapt for Your Project
Copy patterns that fit your needs, customize them.

### Option 3: Delete What You Don't Need
If building something completely different, delete this entire directory.

## Cleanup Guide

**Building a dashboard?**
- ✅ Keep `dashboard/` patterns
- ✅ Keep or adapt `design-systems/`
- Customize component names and styles

**Building an API?**
- ❌ Delete `dashboard/` (not relevant)
- ❌ Delete `design-systems/` (no UI)

**Building a mobile app?**
- Maybe keep `dashboard/` for reference
- Delete `design-systems/` (different design paradigm)

**Building something unique?**
- ⚠️  Review patterns first (might spark ideas)
- Delete if not helpful

## Customization Checklist

If keeping examples:
- [ ] Rename components to match your domain
- [ ] Update design tokens (colors, spacing, fonts)
- [ ] Adapt patterns to your tech stack
- [ ] Remove proffbemanning-specific logic

## Examples Are Not Boilerplate

**Important:** These are examples, not a starter template.

- They're opinionated (not generic)
- They have domain-specific logic
- They use specific design decisions

**Use them as inspiration, not copy-paste.**

---

## File Organization

```
examples/
├── README.md (this file)
├── dashboard/
│   ├── components/      # UI components
│   ├── patterns/        # Reusable patterns
│   └── README.md        # Dashboard-specific docs
└── design-systems/
    ├── ASYMMETRIC_LAYOUT_SYSTEM.md
    └── PREMIUM_DARK_DESIGN_SYSTEM.md
```

---

**Remember:** Examples speed up learning, not copy-paste. Adapt to your needs.

**When in doubt:** Delete. You can always reference the original template if needed.

---

**Source:** proffbemanning-dashboard (17 production sessions)
**Status:** Battle-tested, production-proven patterns
**License:** Use freely, customize as needed
