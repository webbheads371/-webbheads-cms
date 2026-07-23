# Add Deliverables Screen to Client Portal

This plan details how we will add an editable "Deliverables" screen to the client portal onboarding flow, right before the Agreement screen, as requested.

## User Review Required

> [!IMPORTANT]
> **Proposed Content for the Deliverables Screen**
> 
> Here is exactly what the client will see on the new **Deliverables Screen**:
> 
> **Heading:** "Project Deliverables"
> **Description:** "Please review the deliverables for your project below. These are the key items and services we will be providing."
> **Dynamic Content Box:** (This is the text/bullet points that you will edit and type from the Admin panel. It could be formatted text, e.g., "1. 5-page Website 2. Payment Gateway Integration 3. On-page SEO".)
> **Approval Checkbox:** `[ ] I have reviewed and approve the deliverables listed above.`
> **Action Button:** "Approve & Continue to Agreement" (Disabled until the checkbox is checked).
>
> Please let me know if this layout and text look good to you, or if you'd like to adjust the wording before I proceed!

## Open Questions
- Is a standard text area sufficient for you to type in the deliverables on the admin side, or do you need a full rich-text editor (bold, italics, etc.)? I'll use a multi-line text area by default which supports basic spacing.

## Proposed Changes

### Database Changes
#### [NEW] [add_deliverables_to_projects.sql](file:///absolute/path/to/newfile)
We will add three new columns to the existing `projects` table:
- `deliverables_content` (text): To store the dynamic text you write.
- `deliverables_approved` (boolean, default false): To track if the client checked the box.
- `deliverables_approved_at` (timestamp): To log exactly when they approved it.

### Admin Portal (Editing Deliverables)
#### [MODIFY] [project-detail-client.tsx](file:///home/vivek/WEBBHEADSS/webbheads%20cms%20portal%20/src/app/projects/%5Bid%5D/project-detail-client.tsx)
- Add a new "Deliverables" tab (or integrate it into the Client Portal / Agreement tab).
#### [NEW] [deliverables-tab.tsx](file:///home/vivek/WEBBHEADSS/webbheads%20cms%20portal%20/src/app/projects/%5Bid%5D/deliverables-tab.tsx)
- Create a tab where admins can type in and save the `deliverables_content` for the specific project.

### Client Portal (Onboarding Flow)
#### [MODIFY] [page.tsx](file:///home/vivek/WEBBHEADSS/webbheads%20cms%20portal%20/src/app/portal/onboarding/page.tsx)
- Insert the new Deliverables step logic:
  - Step 1: Welcome
  - **Step 2: Deliverables** (Only required if not yet approved)
  - Step 3: Agreement
  - Step 4: Payment
  - Step 5: Profile
#### [NEW] [step-deliverables.tsx](file:///home/vivek/WEBBHEADSS/webbheads%20cms%20portal%20/src/app/portal/onboarding/_components/step-deliverables.tsx)
- Build the client-facing UI that displays the dynamic deliverables text, the approval checkbox, and the submission logic to save the approval to the database.
#### [MODIFY] [wizard-stepper.tsx](file:///home/vivek/WEBBHEADSS/webbheads%20cms%20portal%20/src/app/portal/onboarding/_components/wizard-stepper.tsx)
- Update the stepper UI (the progress bar at the top) to include the new "Deliverables" step before the "Agreement" step.

## Verification Plan

### Manual Verification
1. I will log in as an Admin, open a project, and add some deliverables text.
2. I will log into the Client Portal for that project and verify that the new "Project Deliverables" screen appears right after the Welcome screen.
3. I will check the box, proceed, and ensure it correctly saves the approval and redirects to the Agreement screen.
