# SOC Ransomware Incident Response Playbook

An interactive, single-page SOC playbook website for ransomware incident response.  
It standardizes Tier 1/Tier 2 workflows across all incident phases with escalation criteria, communication templates, legal/regulatory guidance, evidence tracking, and recovery planning.

## What This Project Includes

- Visual ransomware response lifecycle (5 phases) with custom flow diagrams
- Tiered SOC role guidance (Tier 1, Tier 2, Incident Commander)
- Escalation matrix and response timing targets
- First-hour operational checklist with progress tracking
- RACI decision matrix for key actions and approvals
- Legal/regulatory decision flow and notification matrix
- Communication templates (internal SOC, IT Ops, executive, legal, shift handoff)
- Tool-specific hunt/contain query snippets (Sentinel, Splunk, MDE, CrowdStrike)
- Evidence collection board + recovery priority board
- Incident timeline tracker with CSV export
- Sticky section navigation + floating back-to-top control
- Print/export snapshot mode for reports and briefings

## Project Structure

```text
SOC Playbook/
  index.html
  styles.css
  app.js
  Ransomware-Incident-Response-Playbook.md
  assets/
    phase-1-preparation.svg
    phase-2-detection-analysis.svg
    phase-3-containment.svg
    phase-4-eradication-recovery.svg
    phase-5-post-incident.svg
```

## How to Run

This is a static site (no build step required).

1. Open `index.html` in your browser.
2. Use the sticky mini-nav to jump to sections.
3. Use `Print / Export Snapshot` to generate a print-friendly PDF (via browser print dialog).

## Data Persistence

The page stores interactive state in browser `localStorage`:

- First-hour checklist selections
- Incident timeline rows

Use `Reset Saved Data` to clear local state and restore defaults.

## Recommended Use During Incidents

- Start with **Operational Kit** for first 60 minutes.
- Follow **Response Phases** and **Escalation Matrix**.
- Use **Communication Templates** for consistent messaging.
- Update **Timeline** and **Evidence Tracker** continuously.
- Review **Closure and Reopen Criteria** before final closure.

## Customization Ideas

- Replace sample queries with your production SIEM/EDR syntax
- Add org-specific legal timelines and jurisdictions
- Integrate with ticketing fields (ServiceNow/Jira) and incident IDs
- Add authentication if hosting internally

## Version

- Owner: SOC Manager
- Version: 1.0
- Last updated: 2026-03-12
