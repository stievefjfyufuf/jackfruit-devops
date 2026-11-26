# Incident Response Runbook

## Scope and authority

This runbook applies to the Jack Fruit repository, localhost/isolated staging,
and the approved deployment owner. Do not alter production systems, credentials,
or data without the service owner's approval. The incident commander is assigned
by the project owner; this document does not assign a fictional PIC.

## 1. Detection and preservation

1. Record time, reporter, affected component, environment, and observed impact.
2. Preserve scanner output, CI/Jenkins build URL, relevant logs, and commit SHA.
3. Redact secrets from tickets/screenshots; do not commit sensitive reports.
4. Create a vulnerability-register row and set status to `Open`.

## 2. Triage

1. Confirm reproducibility only on localhost or isolated staging.
2. Classify impact and severity using the course/project policy.
3. Check scope: source, dependency, container/IaC, CI, database, or runtime.
4. Assign an incident commander and remediation PIC explicitly; record names only
   after the owner assigns them.

## 3. Containment

1. For a vulnerable branch/CI: stop release approval and mark assessment NO-GO.
2. For a leaked credential: revoke/rotate it through the credential owner; never
   paste it into chat, Git, or logs.
3. For staging: isolate the affected service/network if authorized.
4. For production: obtain owner approval before any containment action; preserve
   evidence and avoid destructive data changes.

## 4. Eradication and recovery

1. Fix the root cause in a scoped branch and add a regression test where viable.
2. Run only relevant local checks, then required CI security gates.
3. Verify recovery with health checks and functional/security regression tests.
4. Update the register with verification evidence; release remains NO-GO until
   the owner changes the assessment after reviewing it.

## 5. Communication and escalation

1. Notify the project owner/course assessor with severity, scope, impact,
   containment state, and next update time.
2. Escalate Critical/High issues to the deployment/credential owner immediately.
3. Use private channels for sensitive details. Public communication contains no
   secrets, exploit payloads, personal data, or infrastructure addresses.

## 6. Post-incident review

Within the agreed review window, record timeline, root cause, impact, what
worked, gaps, corrective actions, owner, due dates, and evidence links. Update
the release assessment and vulnerability register. Do not close the incident
until corrective actions are verified or a named owner records risk acceptance.
