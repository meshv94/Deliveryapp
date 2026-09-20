# AapnuBazaar Admin UI Redesign Rules

## Core Rule

This is an EXISTING production-style application.

UI redesign must never remove existing functionality.

## Never

- Rewrite backend APIs
- Change database schemas
- Remove existing routes
- Remove existing CRUD functionality
- Replace working API calls with mock data
- Replace working state management unnecessarily
- Remove search
- Remove filters
- Remove pagination
- Remove forms
- Remove modals
- Remove permissions
- Remove existing admin functionality
- Hardcode dashboard statistics when API data exists

## Always

- Reuse existing APIs
- Reuse existing services
- Reuse existing hooks
- Reuse existing handlers
- Reuse existing validation
- Preserve authentication
- Preserve authorization
- Preserve routing
- Preserve CRUD operations
- Preserve existing data models

## UI Philosophy

AapnuBazaar
Our Local Marketplace

Primary:
#087F5B

Dark Green:
#075B43

Orange:
#FF6B00

Blue:
#2563EB

Background:
#F3F7FB

White:
#FFFFFF

Text:
#14213D

Secondary:
#64748B

## Design

Modern SaaS marketplace admin.

Clean.
Professional.
Responsive.
Accessible.
Minimal.
Data-focused.

## Architecture

UI
↓
Existing Components / Hooks
↓
Existing Services
↓
Existing APIs
↓
Existing Backend

Never bypass the existing architecture simply to make a UI feature work.