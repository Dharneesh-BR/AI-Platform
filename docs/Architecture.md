# Architecture

The platform remains a modular monolith. Project Onboarding and Company Discovery are additive modules inserted between Projects and Research Pipeline.

## Updated Flow

Authentication → Organizations → Projects → Project Onboarding → Company Discovery → Research Pipeline → Knowledge Base → LangGraph → AI Chat → Reports

## Extension Rule

The Research module is not directly modified. Discovery outputs are stored as `ResearchSource` records that research can consume through a stable boundary.

