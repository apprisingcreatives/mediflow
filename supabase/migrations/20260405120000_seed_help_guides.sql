-- =============================================================================
-- Seed Help Guides & FAQs
-- =============================================================================

DO $$
DECLARE
  -- Patient guide IDs
  p_guide_getting_started     UUID := gen_random_uuid();
  p_guide_booking             UUID := gen_random_uuid();
  p_guide_profile             UUID := gen_random_uuid();
  p_guide_visit_history       UUID := gen_random_uuid();
  p_guide_notifications       UUID := gen_random_uuid();

  -- Clinic admin guide IDs
  ca_guide_dashboard          UUID := gen_random_uuid();
  ca_guide_practitioners      UUID := gen_random_uuid();
  ca_guide_services           UUID := gen_random_uuid();
  ca_guide_patients           UUID := gen_random_uuid();
  ca_guide_appointments       UUID := gen_random_uuid();
  ca_guide_settings           UUID := gen_random_uuid();
  ca_guide_onboarding         UUID := gen_random_uuid();

  -- Practitioner guide IDs
  pr_guide_getting_started    UUID := gen_random_uuid();
  pr_guide_schedule           UUID := gen_random_uuid();
  pr_guide_patient_interact   UUID := gen_random_uuid();
  pr_guide_appointments       UUID := gen_random_uuid();

BEGIN

  -- ===========================================================================
  -- PATIENT GUIDES
  -- ===========================================================================

  INSERT INTO public.help_guides (id, title, body, category, sort_order, is_published, created_at, updated_at) VALUES

  (p_guide_getting_started, 'Getting Started', $body$
Welcome to MediFlow — your personal healthcare companion. This guide walks you through creating your account, completing onboarding, and navigating your patient dashboard.

## Creating Your Account

To get started with MediFlow, you first need to receive an invitation from a clinic. Once your clinic has registered you as a patient, you will receive an email invitation containing a secure link to activate your account.

1. Open the invitation email sent by your clinic.
2. Click the **Activate My Account** link. You will be taken to the MediFlow registration page.
3. Enter your desired password. Passwords must be at least 8 characters and include at least one uppercase letter, one number, and one special character.
4. Click **Create Account** to complete registration.

If you do not receive the invitation email within a few minutes, check your spam or junk folder. Contact your clinic's front desk if the issue persists.

## Completing Your Onboarding

After activating your account, MediFlow will prompt you to complete your patient onboarding. This process collects information your clinic needs before your first appointment.

Onboarding typically includes:
- **Personal information** — Full name, date of birth, sex, contact number, and home address.
- **Emergency contact** — Name, relationship, and phone number of someone to contact in an emergency.
- **Medical history** — Existing conditions, current medications, allergies, and past surgeries.
- **Custom clinic questions** — Your clinic may ask additional questions specific to their practice (e.g., insurance details, referral source).
- **Required documents** — Some clinics ask you to upload documents such as a government-issued ID, insurance card, or referral letter before your first appointment.

Your onboarding progress is saved automatically. You can leave and return at any time — MediFlow will resume from where you left off.

Once all required steps are complete, your onboarding status changes to **Completed** and you gain full access to booking appointments with that clinic.

## Navigating Your Dashboard

After logging in, you land on your **Patient Dashboard**. Here is what you will find:

- **Upcoming Appointments** — A snapshot of your next scheduled visits across all your clinics.
- **My Clinics** — A list of every clinic you are registered with, along with your onboarding status for each one.
- **Recent Activity** — A timeline of recent actions such as bookings, cancellations, and document uploads.
- **Quick Actions** — Shortcuts to book a new appointment or update your profile.

The left sidebar provides navigation to all major sections: Dashboard, Appointments, Visit History, Profile, and Settings.
$body$, 'patient', 1, true, now(), now()),

  (p_guide_booking, 'Booking Appointments', $body$
MediFlow makes it straightforward to find the right practitioner at your clinic and schedule an appointment that fits your schedule. This guide covers every step from browsing available services to confirming your booking.

## Finding a Clinic and Browsing Services

If you are registered with more than one clinic, start by selecting the clinic you want to book with from the **My Clinics** section on your dashboard.

Once inside a clinic, navigate to **Book an Appointment**. You will see:
- A list of available **services** offered by the clinic, each showing the service name, duration, and price.
- A directory of **practitioners** who provide each service.

Select the service you need first. MediFlow will then show you only the practitioners who offer that service, making it easy to choose the right person for your visit.

## Choosing a Practitioner and Time Slot

After selecting a service, choose a practitioner from the list. Each practitioner card displays their name, specialization, and a short bio if provided by the clinic.

Click **View Availability** to open the scheduling calendar for that practitioner. Days that have at least one open slot are highlighted. Click on an available day to see the open time slots for that date.

Select your preferred time slot, then click **Continue**.

## Confirming Your Booking

Before confirming, MediFlow shows you a booking summary:
- Clinic name and address
- Service name and duration
- Practitioner name
- Appointment date and time
- Service fee

Review the details carefully, then click **Confirm Appointment**. You will receive a confirmation notification (email or in-app, depending on your preferences).

## Viewing Upcoming Appointments

All confirmed appointments appear on your **Dashboard** under **Upcoming Appointments** and in the dedicated **Appointments** section. Each appointment card shows:
- Date and time
- Clinic and practitioner name
- Service booked
- Current status (e.g., Pending, Confirmed)

You can cancel an upcoming appointment by opening the appointment card and clicking **Cancel Appointment**. Cancellation policies vary by clinic — check the appointment details for any applicable rules.
$body$, 'patient', 2, true, now(), now()),

  (p_guide_profile, 'Managing Your Profile', $body$
Keeping your profile up to date ensures your clinic always has the information they need to provide you with the best possible care. This guide explains how to update your personal information, medical history, and emergency contacts.

## Accessing Your Profile

Click your name or avatar in the top navigation bar and select **My Profile**, or navigate to **Profile** in the left sidebar.

Your profile is organised into three sections: Personal Information, Medical History, and Emergency Contact.

## Updating Personal Information

In the **Personal Information** tab, you can update:
- Full name
- Date of birth
- Sex
- Contact phone number
- Email address
- Home address

Click **Edit** at the top of the section, make your changes, then click **Save Changes**. MediFlow will confirm the update with a success notification.

Note: Your email address is also used to log in to MediFlow. If you change it, you will need to use the new email on your next login.

## Updating Your Medical History

Accurate medical history helps your practitioners make informed decisions during your visits.

In the **Medical History** tab you can add or update:
- **Existing conditions** — Chronic illnesses or diagnoses (e.g., Type 2 Diabetes, Hypertension).
- **Current medications** — Name, dosage, and frequency.
- **Allergies** — Medication allergies, food allergies, or environmental sensitivities.
- **Past surgeries or procedures** — Approximate dates and procedure names.
- **Family medical history** — Conditions that run in your immediate family.

All fields are free-text to accommodate the wide variety of patient situations. Your medical history is encrypted and only visible to you and the practitioners at your registered clinics.

## Updating Your Emergency Contact

In the **Emergency Contact** tab, enter or update:
- Full name of your emergency contact
- Relationship to you (e.g., Spouse, Parent, Sibling)
- Primary phone number
- Secondary phone number (optional)

It is important to keep this information current so clinic staff can reach the right person quickly if needed.

## Uploading Documents

Some clinics require you to upload supporting documents as part of onboarding or before specific appointments. Go to **Profile > Documents** to view required documents and upload files.

Accepted file formats are PDF, JPG, and PNG. Each file may be up to 10 MB. If a required document is missing or expired, your onboarding status for that clinic may show as Incomplete.
$body$, 'patient', 3, true, now(), now()),

  (p_guide_visit_history, 'Visit History', $body$
Your Visit History in MediFlow gives you a complete record of every appointment you have attended. This is useful for tracking your care over time, preparing for new appointments, or providing information to a new healthcare provider.

## Accessing Visit History

Click **Visit History** in the left sidebar. If you are registered with multiple clinics, your history is grouped by clinic so it is easy to find records from a specific provider.

## Reading an Appointment Record

Each completed appointment in your history shows:
- **Date and time** of the visit
- **Clinic name** and **practitioner** who saw you
- **Service** received
- **Appointment status** — Completed, Cancelled, or No-Show

Click on any record to open the full appointment detail view, which may include additional notes if your clinic has entered them.

## Filtering and Searching

Use the filters at the top of the Visit History page to narrow your records:
- **By clinic** — Show records from one specific clinic.
- **By date range** — Useful for finding visits within a specific period.
- **By status** — Filter to show only Completed or Cancelled appointments.

## Exporting Your History

If you need to share your appointment history with another provider or keep a personal copy, click **Export** on the Visit History page. MediFlow will generate a PDF summary of your records, which you can download or print.

Note: Exported records reflect a snapshot at the time of export. They are not official medical records and do not include clinical notes unless your clinic has explicitly included them.
$body$, 'patient', 4, true, now(), now()),

  (p_guide_notifications, 'Notifications & Settings', $body$
MediFlow keeps you informed about your appointments and account activity through notifications. This guide explains how to customise your notification preferences and manage your account security settings.

## Managing Notification Preferences

Navigate to **Settings > Notifications** to control how MediFlow contacts you.

You can toggle the following notification types on or off:
- **Appointment Reminders** — Receive a reminder before an upcoming appointment. You can choose to be reminded 24 hours before, 1 hour before, or both.
- **Appointment Confirmations** — Get notified when a clinic confirms your booked appointment.
- **Appointment Cancellations** — Be alerted if your clinic cancels or reschedules an appointment.
- **Onboarding Reminders** — Receive nudges to complete outstanding onboarding steps for a clinic.
- **New Messages** — Get notified when your clinic sends you a message through MediFlow.

For each notification type, you can independently choose your delivery channels:
- **Email** — Sent to the email address on your account.
- **In-App** — Shown inside MediFlow when you are logged in, accessible via the bell icon in the navigation bar.

Click **Save Preferences** after making changes.

## Changing Your Password

To update your password, go to **Settings > Security** and click **Change Password**.

You will need to enter:
1. Your current password.
2. Your new password.
3. Confirmation of your new password.

Passwords must be at least 8 characters and include at least one uppercase letter, one number, and one special character. Click **Update Password** to apply the change. You will receive a confirmation email to your registered address.

If you have forgotten your current password, log out and use the **Forgot Password** link on the login page instead.

## Account Deactivation

If you wish to deactivate your MediFlow account, contact the front desk at any of your registered clinics. Account deactivation is managed by clinic administrators to ensure continuity of your healthcare records.
$body$, 'patient', 5, true, now(), now());


  -- ===========================================================================
  -- CLINIC ADMIN GUIDES
  -- ===========================================================================

  INSERT INTO public.help_guides (id, title, body, category, sort_order, is_published, created_at, updated_at) VALUES

  (ca_guide_dashboard, 'Dashboard Overview', $body$
The Clinic Admin Dashboard is your central command centre for managing every aspect of your clinic in MediFlow. This guide explains each component and how to use them effectively.

## Accessing the Dashboard

After logging in with your clinic admin credentials, you are taken directly to your clinic's Dashboard. The left sidebar provides navigation to all major sections: Dashboard, Practitioners, Services, Patients, Appointments, and Settings.

## Key Metrics

At the top of the Dashboard, four metric cards give you a real-time snapshot of your clinic's activity:

- **Total Patients** — The number of patients currently registered with your clinic.
- **Appointments Today** — The count of appointments scheduled for today, regardless of status.
- **Pending Appointments** — Appointments that have been booked but not yet confirmed by a practitioner or admin.
- **Active Practitioners** — The number of practitioners currently active and available to take appointments.

These numbers update automatically as activity occurs.

## Today's Appointment Schedule

Below the metrics, a timeline view shows all of today's appointments grouped by time slot. Each entry shows:
- Patient name
- Practitioner assigned
- Service booked
- Current status (Pending, Confirmed, Completed, Cancelled, No-Show)

You can click any appointment to open its detail panel and take action — confirm, mark as complete, or cancel.

## Recent Activity Log

The Activity Log on the right side of the Dashboard shows a chronological feed of recent actions taken within your clinic account, such as:
- New patient registrations
- Appointment bookings and cancellations
- Practitioner profile changes
- Service updates

Each entry records the action type, the user who performed it, and the timestamp. This log is useful for auditing and quickly understanding what has changed in your clinic.

## Quick Actions

The Quick Actions panel provides one-click shortcuts to the most common tasks: adding a new practitioner, creating a service, or viewing all pending appointments.
$body$, 'clinic_admin', 1, true, now(), now()),

  (ca_guide_practitioners, 'Managing Practitioners', $body$
Practitioners are the clinicians and specialists at your clinic who provide services and see patients. This guide covers how to invite, manage, and deactivate practitioners in MediFlow.

## Adding a New Practitioner

Navigate to **Practitioners** in the sidebar, then click **Add Practitioner**.

Fill in the required details:
- **Full name** — The practitioner's display name shown to patients.
- **Email address** — Used to send the invitation and as the practitioner's login credential.
- **Specialization** — Their area of expertise (e.g., General Practice, Dermatology, Physiotherapy).
- **License number** — Optional but recommended for regulatory compliance.
- **Bio** — A short description visible to patients when they browse practitioners.
- **Profile photo** — Upload a professional photo (JPG or PNG, up to 2 MB).

Click **Send Invitation**. MediFlow will send the practitioner an email with a link to activate their account and set their password. Their status will show as **Invited** until they complete activation.

## Editing Practitioner Details

To update a practitioner's profile, click on their name in the Practitioners list, then click **Edit Profile**. You can update all fields except their email address. To change their login email, the practitioner must request the change through Settings within their own account.

## Managing Practitioner Schedules

After selecting a practitioner, go to the **Schedule** tab on their profile. Here you can define:
- **Working days** — Which days of the week they are available.
- **Working hours** — Start and end times for each working day. You can add multiple time blocks per day (e.g., 09:00–12:00 and 14:00–17:00) to accommodate a lunch break or split shift.
- **Services offered** — Which of your clinic's services this practitioner is authorised to perform. Only assigned services will appear when patients book with this practitioner.

Click **Save Schedule** to apply changes. Existing bookings are not affected by schedule changes; only future availability is updated.

## Deactivating a Practitioner

If a practitioner leaves the clinic or is temporarily unavailable, you can deactivate their account without deleting it. Open their profile and click **Deactivate Practitioner**.

Deactivated practitioners:
- Cannot log in to MediFlow.
- Are hidden from patients when booking new appointments.
- Retain all historical appointment records for auditing and patient history purposes.

To reactivate a practitioner, open their profile and click **Reactivate**.
$body$, 'clinic_admin', 2, true, now(), now()),

  (ca_guide_services, 'Managing Services', $body$
Services in MediFlow represent the treatments, consultations, and procedures your clinic offers. Patients select a service when booking an appointment, so it is important to keep your service list accurate and up to date.

## Adding a New Service

Navigate to **Services** in the sidebar, then click **Add Service**.

Complete the service form:
- **Service name** — A clear, patient-friendly name (e.g., "General Consultation", "Dental Cleaning", "Physiotherapy Session").
- **Description** — A brief explanation of what the service involves. This is shown to patients during booking.
- **Duration** — How long the appointment slot should be, in minutes. Common values are 15, 30, 45, and 60 minutes, but you can enter any value.
- **Price** — The fee for this service in Philippine Peso (PHP). Enter 0 for services that are free or billed separately.
- **Currency** — Defaults to PHP. Contact MediFlow support if your clinic operates in a different currency.
- **Assign practitioners** — Select which practitioners at your clinic offer this service. Only assigned practitioners will be bookable for this service.

Click **Create Service** to publish it immediately, or toggle **Active** to off if you want to save it without making it available to patients yet.

## Editing a Service

To update a service, click on its name in the Services list, then click **Edit**. All fields are editable. Changes take effect immediately for any new bookings; existing appointments are not altered.

## Deactivating or Deleting a Service

- **Deactivate** — Hides the service from patients so no new appointments can be booked, but preserves all historical appointment records. This is the recommended approach when a service is temporarily unavailable.
- **Delete** — Permanently removes the service. This action is only available if the service has no associated appointments. MediFlow will warn you before deletion.

To deactivate a service, open it and toggle the **Active** switch to off. To delete, click the **Delete** button (only visible if the service has no appointment history).

## Service Pricing Tips

MediFlow displays service prices to patients during booking so they know the expected cost upfront. Keep prices updated to avoid confusion at reception. If your clinic uses insurance billing and prices vary, consider using the description field to note that the displayed price is an estimate.
$body$, 'clinic_admin', 3, true, now(), now()),

  (ca_guide_patients, 'Patient Management', $body$
The Patients section gives you a comprehensive view of every patient registered with your clinic. This guide explains how to view patient records, monitor onboarding status, and manage patient accounts.

## Viewing the Patient List

Navigate to **Patients** in the sidebar. The patient list shows all patients registered with your clinic, including their name, contact information, registration date, and onboarding status.

Use the search bar to find a specific patient by name, email, or contact number. You can also filter by:
- **Onboarding status** — Completed, In Progress, or Not Started.
- **Registration date** — Find patients who joined within a specific period.
- **Activity** — Filter by patients who have or have not had a recent appointment.

Switch between **Card View** and **List View** using the toggle at the top right. Card view shows patient photos and a quick summary; list view shows more detailed information in a compact table format.

## Viewing a Patient Record

Click on any patient to open their full record. The patient detail page is organised into tabs:

- **Overview** — A summary of the patient's profile, onboarding completion, and upcoming appointments.
- **Personal Info** — Name, date of birth, sex, contact number, address, and emergency contact.
- **Medical History** — Conditions, medications, allergies, surgeries, and family history as entered by the patient.
- **Appointments** — A full history of the patient's appointments with your clinic, including upcoming and past visits.
- **Documents** — Files uploaded by the patient in response to your clinic's required document requests.
- **Onboarding Responses** — Answers the patient provided to your clinic's custom onboarding questions.
- **Activity Log** — A timestamped record of all actions related to this patient, such as bookings, document uploads, and profile updates.

## Monitoring Onboarding Status

A patient's onboarding status is visible both on the patient list and in their record. Statuses are:
- **Not Started** — The patient has been invited but has not begun onboarding.
- **In Progress** — The patient has started but not yet completed all required steps.
- **Completed** — All required questions answered and required documents uploaded.

Patients with an Incomplete status may not be able to book certain appointment types depending on your clinic's settings. You can send a reminder to a patient to complete their onboarding by clicking **Send Onboarding Reminder** on their profile.

## Deactivating a Patient

If a patient should no longer have access to your clinic (e.g., they have transferred to another provider), you can deactivate their account by opening their record and clicking **Deactivate Patient**. Their historical records are preserved.
$body$, 'clinic_admin', 4, true, now(), now()),

  (ca_guide_appointments, 'Appointments & Scheduling', $body$
The Appointments section is your hub for viewing, managing, and acting on all appointments at your clinic. This guide covers how to navigate your schedule, handle specific appointment statuses, and manage cancellations.

## Viewing the Appointments Calendar

Navigate to **Appointments** in the sidebar. The default view is a **Calendar** showing all appointments for the current week. Switch to a **Day**, **Week**, or **Month** view using the controls at the top.

Each appointment on the calendar is colour-coded by status:
- **Blue** — Pending (booked but not yet confirmed)
- **Green** — Confirmed
- **Grey** — Completed
- **Red** — Cancelled
- **Orange** — No-Show

Click any appointment block to open the appointment detail panel.

## Filtering Appointments

Use the filters panel to narrow the view:
- **By practitioner** — Show only appointments for a specific team member.
- **By service** — Filter to a particular service type.
- **By status** — Useful for focusing on Pending appointments that need action.
- **By date range** — Review a specific period.

## Taking Action on Appointments

From the appointment detail panel, clinic admins can:
- **Confirm** a Pending appointment — Notifies the patient that their booking is confirmed.
- **Mark as Completed** — Records the appointment as attended after the visit.
- **Mark as No-Show** — Records that the patient did not attend without cancelling in advance. MediFlow also auto-detects no-shows for confirmed appointments that have passed without being updated.
- **Cancel** — Cancels the appointment and sends a notification to the patient. You will be prompted to provide a cancellation reason, which is included in the patient's notification.

## Managing Cancellations

When a clinic admin cancels an appointment, the system:
1. Updates the appointment status to Cancelled.
2. Sends a cancellation notification to the patient (if email or in-app notifications are enabled for that patient).
3. Logs the cancellation in the clinic's Activity Log with the admin's name and the reason provided.

Cancelled appointment slots become available again for other patients to book immediately.

## Booking Appointments on Behalf of a Patient

Clinic admins can book appointments directly on behalf of patients. From the Appointments page, click **New Appointment**, select the patient, service, practitioner, and time slot, then click **Book**. The patient will receive a confirmation notification.
$body$, 'clinic_admin', 5, true, now(), now()),

  (ca_guide_settings, 'Clinic Settings', $body$
Clinic Settings is where you manage your clinic's identity, notification behaviour, and subscription. This guide walks through each settings area.

## Clinic Information

Navigate to **Settings > Clinic Info**. Here you can update:
- **Clinic name** — The display name shown to patients across all MediFlow interfaces.
- **Email address** — The primary contact email for your clinic. This is also used for system notifications.
- **Phone number** — Your clinic's contact number.
- **Address** — The physical address of your clinic, shown to patients on appointment confirmations.
- **City** — Used for search and directory purposes.
- **Description** — A short description of your clinic shown on your public profile.
- **Logo** — Upload your clinic's logo (PNG or JPG, minimum 200×200 px, up to 2 MB). The logo appears in patient-facing communications and on your clinic profile.

Click **Save Changes** after updating any field.

## Notification Settings

Navigate to **Settings > Notifications** to configure how MediFlow communicates appointment events to patients on your clinic's behalf.

You can enable or disable the following notification triggers:
- **Appointment confirmation** — Send a notification when a clinic admin or practitioner confirms a pending booking.
- **Appointment cancellation** — Notify patients when their appointment is cancelled.
- **Appointment reminders** — Send reminders before upcoming appointments (24 hours and/or 1 hour before).
- **Onboarding reminders** — Prompt patients who have not completed onboarding.

For each trigger, choose between Email, In-App, or both delivery methods. Note that individual patients can override these preferences in their own notification settings.

## Subscription & Billing

Navigate to **Settings > Subscription** to view your current plan details:
- Plan name and features included
- Billing cycle (monthly or yearly)
- Next billing date
- Payment status

To upgrade, downgrade, or change your billing cycle, click **Change Plan** and select from the available options. Changes to a higher tier take effect immediately; downgrades are applied at the end of the current billing period.

For billing enquiries or to request an invoice, contact MediFlow support from this page.

## Password & Security

To change your admin login password, navigate to **Settings > Security** and click **Change Password**. Enter your current password, then your new password twice. Click **Update Password** to apply.
$body$, 'clinic_admin', 6, true, now(), now()),

  (ca_guide_onboarding, 'Onboarding Configuration', $body$
MediFlow allows you to customise the onboarding experience for your patients by defining specific questions and required documents. This ensures your clinic collects exactly the information it needs before a patient's first appointment.

## Accessing Onboarding Configuration

Navigate to **Settings > Onboarding** (or **Onboarding** in the sidebar, depending on your MediFlow version). This section has two tabs: **Questions** and **Required Documents**.

## Setting Up Custom Onboarding Questions

Click the **Questions** tab. These are questions that patients must answer as part of their onboarding process with your clinic.

To add a new question, click **Add Question** and fill in:
- **Question text** — The question as it will appear to the patient (e.g., "How did you hear about our clinic?", "Do you have health insurance?").
- **Response type** — Choose from:
  - **Text** — Free-form short answer.
  - **Textarea** — Longer free-form response.
  - **Yes/No** — A simple binary choice.
  - **Select** — A dropdown with options you define.
- **Required** — Toggle on to make this question mandatory. Patients cannot complete onboarding without answering required questions.
- **Sort order** — Control the sequence in which questions appear during onboarding.

You can reorder questions by dragging them, and edit or delete any question at any time. Changes apply to new onboarding sessions; patients who have already answered a deleted question retain their response in the system.

## Configuring Required Documents

Click the **Required Documents** tab. Here you define which supporting documents patients must upload before their onboarding is considered complete.

To add a required document, click **Add Document** and fill in:
- **Document name** — A clear label for the patient (e.g., "Government-Issued ID", "PhilHealth Card", "Referral Letter").
- **Description** — Optional additional instructions for the patient (e.g., "Upload a clear photo or scan of the front of your ID.").
- **Required** — Toggle on to make this document mandatory for onboarding completion.

Patients will see each required document listed in their onboarding checklist and can upload files (PDF, JPG, PNG) directly from their profile.

## Reviewing Patient Onboarding Responses

To see how a specific patient answered your onboarding questions, navigate to **Patients**, open the patient's record, and click the **Onboarding Responses** tab. You will see their answer to each question alongside the question text, with a timestamp for when they submitted their response.
$body$, 'clinic_admin', 7, true, now(), now());


  -- ===========================================================================
  -- PRACTITIONER GUIDES
  -- ===========================================================================

  INSERT INTO public.help_guides (id, title, body, category, sort_order, is_published, created_at, updated_at) VALUES

  (pr_guide_getting_started, 'Getting Started as a Practitioner', $body$
Welcome to MediFlow. As a practitioner, MediFlow gives you a clear view of your schedule, your patients, and your appointment history — all in one place. This guide covers your first login and the key areas of your dashboard.

## Receiving Your Invitation

Your clinic administrator will invite you to MediFlow using your email address. You will receive an email with the subject line "You have been invited to MediFlow". Open the email and click **Activate My Account**.

You will be directed to a page where you can set your password. Choose a strong password (at least 8 characters, including one uppercase letter, one number, and one special character), then click **Create Account**.

## Logging In

Visit the MediFlow login page and enter your email address and password. If your clinic uses a custom MediFlow URL (e.g., yourclinic.mediflow.ph), navigate there directly. Select **Practitioner** as your account type on the login screen.

If you forget your password at any time, click **Forgot Password** on the login page and follow the instructions sent to your email.

## Understanding Your Dashboard

Once logged in, you land on your **Practitioner Dashboard**. The key sections are:

- **Today's Schedule** — A chronological list of all your appointments for today, showing the patient name, service, and appointment time. This is your primary daily view.
- **Upcoming Appointments** — A forward-looking view of your scheduled appointments for the rest of the week.
- **Recent Patients** — Quick links to the profiles of patients you have recently seen.
- **Stats Overview** — Counts of your total appointments this month, completion rate, and any pending appointments that need your attention.

The left sidebar lets you navigate to: Dashboard, My Schedule, Patients, and Settings.

## Your Profile

Click your name in the top navigation bar to view and edit your practitioner profile. You can update your display name, specialization, bio, and profile photo. Your email address and schedule are managed by your clinic administrator.
$body$, 'practitioner', 1, true, now(), now()),

  (pr_guide_schedule, 'Managing Your Schedule', $body$
Your schedule in MediFlow is configured by your clinic administrator and reflects the working hours and services you have been assigned. This guide explains how to read your schedule, understand your availability, and stay on top of your upcoming appointments.

## Viewing Your Schedule

Navigate to **My Schedule** in the left sidebar. The default view shows the current week as a calendar grid. Each appointment block displays:
- The patient's name
- The service type
- The start time and duration

Switch between **Day**, **Week**, and **Month** views using the tabs at the top. Use the arrow buttons to navigate to previous or future periods.

## Understanding Your Availability

Your available working hours are shown as open (white) blocks on the calendar. Booked appointment slots are filled with appointment cards. Blocked or outside-hours time is shown in a darker shade.

Your working hours are set by your clinic administrator in your practitioner profile. If you need to adjust your availability (e.g., for a day off or changed hours), contact your clinic admin. They can update your schedule directly in the clinic admin portal.

## Appointment Status Reference

Each appointment on your calendar is colour-coded:
- **Blue** — Pending (booked by patient, awaiting confirmation)
- **Green** — Confirmed (appointment is confirmed and upcoming)
- **Grey** — Completed (appointment has been marked as attended)
- **Red** — Cancelled (appointment was cancelled)
- **Orange** — No-Show (patient did not attend)

## Filtering Your Calendar

If you work across multiple services, use the **Service** filter to focus your calendar view on a specific appointment type. You can also filter by date range to review a past or future period.

## Upcoming Appointments

The **Upcoming Appointments** panel on your dashboard shows your next five scheduled appointments in a simplified list. Click any entry to jump to the full appointment detail view where you can review the patient's information and take action on the appointment.
$body$, 'practitioner', 2, true, now(), now()),

  (pr_guide_patient_interact, 'Patient Interactions', $body$
MediFlow gives you access to essential patient information to help you prepare for and deliver quality care. This guide explains what patient information you can view, how to access it before an appointment, and how to review a patient's history with your clinic.

## Accessing Patient Information

You can reach patient information in two ways:

1. **From your schedule** — Click on any appointment in your calendar or appointment list to open the appointment detail panel. The panel includes a link to the patient's profile.
2. **From the Patients section** — Navigate to **Patients** in the sidebar to see all patients who have booked an appointment with you. Use the search bar to find a specific patient by name.

## What You Can See

When you open a patient's profile, you have access to:

- **Personal Information** — Name, date of birth, sex, and contact number. Address is visible if provided by the patient.
- **Emergency Contact** — The name, relationship, and phone number of the patient's nominated emergency contact.
- **Medical History** — Conditions, medications, allergies, past surgeries, and family history as entered by the patient during onboarding or profile updates. This information is patient-entered and should be verified verbally during consultations.
- **Appointment History** — All previous appointments the patient has had at your clinic, including dates, services, and statuses. This gives you context about their care journey.
- **Onboarding Responses** — Answers the patient gave to your clinic's custom onboarding questions. This may include information such as insurance status, referral source, or clinical pre-screening answers relevant to your practice.
- **Documents** — Files the patient has uploaded as part of onboarding (e.g., ID, insurance card, referral letter). Click any document to view it in the browser or download it.

## Patient Privacy

MediFlow enforces strict access controls. You can only see patients who have at least one appointment record at your clinic. Patient information is never shared across clinics — a patient's records at another clinic are not visible to you.

All access to patient records is logged in the system's audit trail for compliance purposes.

## Preparing for an Appointment

Before your first appointment with a new patient, it is good practice to:
1. Review their medical history and any listed allergies or current medications.
2. Read their answers to your clinic's onboarding questions.
3. Check any uploaded documents (e.g., referral letters or prior test results).

This preparation ensures a smoother, more informed consultation.
$body$, 'practitioner', 3, true, now(), now()),

  (pr_guide_appointments, 'Appointment Management', $body$
As a practitioner, you can take direct action on your appointments in MediFlow — confirming bookings, marking visits as complete, and recording no-shows. This guide covers each action and when to use it.

## Opening an Appointment

From your schedule or the Upcoming Appointments list on your dashboard, click any appointment to open the **Appointment Detail** panel. This panel shows:
- Patient name, with a link to their full profile
- Service booked and duration
- Appointment date and time
- Current status
- Any notes added at the time of booking

## Confirming an Appointment

When a patient books an appointment, its status starts as **Pending**. Confirming the appointment signals to the patient that their booking is locked in.

To confirm, open the appointment and click **Confirm Appointment**. The status changes to **Confirmed** and the patient receives a confirmation notification (if they have notifications enabled).

Your clinic administrator can also confirm appointments on your behalf from the clinic admin portal.

## Marking an Appointment as Completed

After a patient attends their visit, update the appointment status to record that the consultation took place.

Open the appointment and click **Mark as Completed**. The status changes to **Completed** and the appointment moves to the patient's Visit History. This keeps your schedule tidy and ensures accurate reporting for clinic management.

Best practice is to mark appointments as completed at the end of each consultation or at the close of each day.

## Handling No-Shows

If a patient does not attend their confirmed appointment without prior notice, record it as a no-show.

Open the appointment and click **Mark as No-Show**. The status changes to **No-Show**. This helps your clinic track attendance patterns and follow up with patients if needed.

Note: MediFlow also automatically detects no-shows for confirmed appointments that have passed the scheduled time by more than 30 minutes without any status update. These are flagged and updated by the system automatically.

## Cancelling an Appointment

If an appointment needs to be cancelled (e.g., you are unexpectedly unavailable), open it and click **Cancel Appointment**. You will be asked to provide a brief reason. The patient receives a cancellation notification and the time slot becomes available for rebooking.

For planned leave or schedule changes, contact your clinic administrator so they can block your availability in advance and notify affected patients proactively.
$body$, 'practitioner', 4, true, now(), now());


  -- ===========================================================================
  -- PATIENT FAQS
  -- ===========================================================================

  INSERT INTO public.help_guide_faqs (id, guide_id, question, answer, sort_order, created_at) VALUES

  -- Getting Started FAQs
  (gen_random_uuid(), p_guide_getting_started,
   'I did not receive my invitation email. What should I do?',
   'Check your spam or junk folder first, as automated emails can sometimes be filtered. If the email is not there, contact your clinic''s front desk and ask them to resend the invitation. Make sure to provide them with the correct email address you want to use for your MediFlow account.',
   1, now()),

  (gen_random_uuid(), p_guide_getting_started,
   'Can I register on MediFlow without an invitation?',
   'No. MediFlow is a clinic-managed platform, which means your account is created by your clinic. Patients cannot self-register. If you would like to use MediFlow, contact a clinic that uses MediFlow and ask them to add you as a patient.',
   2, now()),

  (gen_random_uuid(), p_guide_getting_started,
   'I completed onboarding for one clinic. Do I have to do it again for a different clinic?',
   'Yes. Each clinic collects its own set of information through onboarding. Your basic profile details (name, date of birth, contact info) carry over, but clinic-specific questions and required documents are unique to each clinic and must be completed separately.',
   3, now()),

  (gen_random_uuid(), p_guide_getting_started,
   'What does the onboarding status "In Progress" mean?',
   '"In Progress" means you have started your onboarding but have not yet answered all required questions or uploaded all required documents. Go to your profile or the clinic card on your dashboard and click "Continue Onboarding" to pick up where you left off.',
   4, now()),

  (gen_random_uuid(), p_guide_getting_started,
   'Is my health information safe in MediFlow?',
   'Yes. MediFlow encrypts all personal and medical data at rest and in transit. Access to your records is strictly limited — only you and the practitioners at your registered clinics can view your information. MediFlow does not sell or share patient data with third parties.',
   5, now()),

  -- Booking Appointments FAQs
  (gen_random_uuid(), p_guide_booking,
   'Why can I not book an appointment with a specific practitioner?',
   'There are a few possible reasons: the practitioner may have no available slots within the selected period, they may not offer the service you selected, or they may be temporarily deactivated. Try selecting a different service or check back later for new availability.',
   1, now()),

  (gen_random_uuid(), p_guide_booking,
   'Can I book multiple appointments at once?',
   'Yes. Each booking is processed individually. After confirming one appointment, return to the Book an Appointment page and repeat the process for each additional visit you need to schedule.',
   2, now()),

  (gen_random_uuid(), p_guide_booking,
   'How will I know when my appointment is confirmed?',
   'You will receive a notification via your preferred channels (email and/or in-app) once a clinic admin or practitioner confirms your booking. Until then, your appointment status shows as "Pending". You can check the current status at any time in the Appointments section.',
   3, now()),

  (gen_random_uuid(), p_guide_booking,
   'Can I cancel an appointment I have already booked?',
   'Yes. Open the appointment from your Appointments section and click "Cancel Appointment". Cancellation policies vary by clinic — some may require notice within a certain timeframe. Review the appointment details or contact your clinic if you are unsure of their policy.',
   4, now()),

  -- Managing Profile FAQs
  (gen_random_uuid(), p_guide_profile,
   'Will updating my email address change my login credentials?',
   'Yes. Your email address is used as your login username. If you update it in your profile, you will need to use the new email address the next time you log in. You will also receive a confirmation email to your old address to verify the change.',
   1, now()),

  (gen_random_uuid(), p_guide_profile,
   'Who can see my medical history?',
   'Your medical history is visible to you and to the practitioners and clinic administrators at any clinic you are registered with in MediFlow. It is not shared with other clinics or any external parties.',
   2, now()),

  (gen_random_uuid(), p_guide_profile,
   'What file formats are accepted for document uploads?',
   'MediFlow accepts PDF, JPG, and PNG files for document uploads. Each individual file must be no larger than 10 MB. If you need to upload a multi-page document, consider combining the pages into a single PDF before uploading.',
   3, now()),

  (gen_random_uuid(), p_guide_profile,
   'Can I delete a document I previously uploaded?',
   'You can upload a replacement document, but deletion of previously submitted documents must be requested through your clinic. Contact your clinic''s front desk if you need a document removed from your record.',
   4, now()),

  -- Visit History FAQs
  (gen_random_uuid(), p_guide_visit_history,
   'Why are some of my old appointments not showing in Visit History?',
   'Visit History shows appointments managed through MediFlow. If your clinic joined MediFlow recently, appointments that occurred before they migrated to the platform may not appear. Contact your clinic for records pre-dating their MediFlow adoption.',
   1, now()),

  (gen_random_uuid(), p_guide_visit_history,
   'Can I use my MediFlow Visit History as an official medical record?',
   'No. The Visit History is a summary of appointment activity and is not a substitute for official medical records or clinical notes. For official records, request them directly from your clinic.',
   2, now()),

  (gen_random_uuid(), p_guide_visit_history,
   'Does my visit history from one clinic appear when I visit another clinic on MediFlow?',
   'No. Each clinic only sees appointments that occurred within their own clinic. Your visit history at Clinic A is not visible to practitioners or admins at Clinic B.',
   3, now()),

  -- Notifications & Settings FAQs
  (gen_random_uuid(), p_guide_notifications,
   'I stopped receiving appointment reminders. What should I check?',
   'Go to Settings > Notifications and verify that Appointment Reminders are toggled on and that at least one delivery channel (Email or In-App) is enabled. Also check your email spam folder, as reminder emails can occasionally be filtered.',
   1, now()),

  (gen_random_uuid(), p_guide_notifications,
   'I forgot my password. How do I reset it?',
   'On the MediFlow login page, click "Forgot Password" and enter your registered email address. You will receive a password reset link. Click the link in the email (it expires after 24 hours) and follow the prompts to set a new password.',
   2, now()),

  (gen_random_uuid(), p_guide_notifications,
   'Can I turn off all notifications?',
   'Yes. In Settings > Notifications, you can toggle off each individual notification type. You can also disable both Email and In-App delivery channels for any notification type, which effectively silences it. Note that certain critical account notifications (e.g., password change confirmations) cannot be disabled for security reasons.',
   3, now());


  -- ===========================================================================
  -- CLINIC ADMIN FAQS
  -- ===========================================================================

  INSERT INTO public.help_guide_faqs (id, guide_id, question, answer, sort_order, created_at) VALUES

  -- Dashboard Overview FAQs
  (gen_random_uuid(), ca_guide_dashboard,
   'The appointment count on my dashboard does not match what I see in the Appointments section. Why?',
   'The dashboard metric shows only appointments scheduled for today. The Appointments section includes all appointments across all dates. Use the date filter in the Appointments section to see only today''s bookings if you need to cross-check.',
   1, now()),

  (gen_random_uuid(), ca_guide_dashboard,
   'How far back does the Recent Activity Log go?',
   'The Activity Log on the Dashboard shows the most recent 50 events. To see a fuller history, navigate to the dedicated Activity Log section (if available in your plan) or filter the log within the dashboard by date range.',
   2, now()),

  (gen_random_uuid(), ca_guide_dashboard,
   'Can I customise which metrics appear on my dashboard?',
   'Dashboard metric cards are currently fixed. If you have specific reporting needs, MediFlow''s support team can discuss custom analytics options available on the Enterprise plan.',
   3, now()),

  -- Managing Practitioners FAQs
  (gen_random_uuid(), ca_guide_practitioners,
   'A practitioner says they never received their invitation email. What can I do?',
   'Open the practitioner''s profile in the Practitioners list and click "Resend Invitation". This sends a fresh invitation email to the address on file. If the email address is incorrect, edit the profile first to correct it, then resend.',
   1, now()),

  (gen_random_uuid(), ca_guide_practitioners,
   'Can I change a practitioner''s email address?',
   'Practitioner email addresses can be updated by a clinic admin from the practitioner''s profile edit page. Note that the practitioner will need to use the new email to log in after the change.',
   2, now()),

  (gen_random_uuid(), ca_guide_practitioners,
   'What happens to existing appointments if I deactivate a practitioner?',
   'Existing appointments for a deactivated practitioner are not automatically cancelled — they remain in their current status. You should review and manually reassign or cancel any pending or confirmed future appointments before deactivating a practitioner.',
   3, now()),

  (gen_random_uuid(), ca_guide_practitioners,
   'Can a practitioner have different working hours on different days?',
   'Yes. In the practitioner''s Schedule tab, you can set different start and end times for each day of the week. You can also add multiple time blocks per day (e.g., morning and afternoon sessions) to accommodate split shifts or lunch breaks.',
   4, now()),

  -- Managing Services FAQs
  (gen_random_uuid(), ca_guide_services,
   'Can I change the price of a service after patients have already booked it?',
   'Yes. Updating a service price takes effect for new bookings immediately. Existing appointments retain the price that was in effect when they were booked.',
   1, now()),

  (gen_random_uuid(), ca_guide_services,
   'Why can patients not see a service I just created?',
   'Check that the service is set to Active. Also verify that at least one practitioner has been assigned to the service — patients cannot book a service if there are no practitioners assigned to deliver it.',
   2, now()),

  (gen_random_uuid(), ca_guide_services,
   'Can I offer the same service at different price points for different practitioners?',
   'Currently, service pricing is set at the service level and applies to all practitioners who offer it. If you need different pricing per practitioner, create separate service entries (e.g., "Consultation - Dr. Santos" and "Consultation - Dr. Cruz") and assign each to the relevant practitioner.',
   3, now()),

  -- Patient Management FAQs
  (gen_random_uuid(), ca_guide_patients,
   'Can I add a patient to MediFlow manually without sending an email invitation?',
   'You can create a patient record and set a temporary password on their behalf. The patient can then log in and update their password. However, the standard flow is to send an invitation email so the patient activates their own account securely.',
   1, now()),

  (gen_random_uuid(), ca_guide_patients,
   'A patient says their onboarding is complete but it still shows "In Progress" in my system. What should I check?',
   'Open the patient''s record and review the Onboarding Responses and Documents tabs. If any required question is unanswered or a required document is missing, the system will not mark onboarding as complete. The patient may need to log in and complete those specific items.',
   2, now()),

  (gen_random_uuid(), ca_guide_patients,
   'Can I edit a patient''s personal information on their behalf?',
   'Clinic admins can view patient information but editing personal details (name, date of birth, medical history) is reserved for the patient themselves to maintain data integrity. You can update contact information in emergency situations — contact MediFlow support for assistance.',
   3, now()),

  -- Appointments & Scheduling FAQs
  (gen_random_uuid(), ca_guide_appointments,
   'Can I book a repeat appointment for a patient at the same time each week?',
   'Recurring appointment booking is not currently available. Each appointment must be booked individually. This feature is on the MediFlow product roadmap — contact support to register your interest.',
   1, now()),

  (gen_random_uuid(), ca_guide_appointments,
   'A patient did not show up. Will MediFlow automatically update the appointment status?',
   'Yes. MediFlow automatically marks confirmed appointments as No-Show if they pass their scheduled time by 30 minutes without being updated. The system checks every 5 minutes. You can also manually mark an appointment as No-Show before the automated check runs.',
   2, now()),

  (gen_random_uuid(), ca_guide_appointments,
   'Can I move an appointment to a different time slot?',
   'Direct rescheduling is not available in the current version. To move an appointment, cancel the existing one and create a new booking at the desired time. A cancellation notification will be sent to the patient, so it is good practice to contact them directly to explain the change.',
   3, now()),

  -- Clinic Settings FAQs
  (gen_random_uuid(), ca_guide_settings,
   'Will changing my clinic name affect existing patient records or appointment history?',
   'Existing records will display the updated clinic name going forward. Historical records and notifications sent before the change will retain the name that was in use at the time. Patient-facing appointment confirmations generated after the name change will use the new name.',
   1, now()),

  (gen_random_uuid(), ca_guide_settings,
   'How do I cancel my MediFlow subscription?',
   'To cancel your subscription, navigate to Settings > Subscription and click "Cancel Subscription". You will be prompted to confirm. Your clinic account remains active until the end of the current billing period. Contact MediFlow support if you need assistance with the cancellation process.',
   2, now()),

  (gen_random_uuid(), ca_guide_settings,
   'Can I have multiple admin accounts for my clinic?',
   'Currently, each clinic has one primary admin account. If you need to share admin access, contact MediFlow support. Multi-admin support is planned for a future release.',
   3, now()),

  -- Onboarding Configuration FAQs
  (gen_random_uuid(), ca_guide_onboarding,
   'If I delete an onboarding question, will I lose patients'' existing answers?',
   'No. Patient responses to a deleted question are retained in the database and are still visible in the patient''s Onboarding Responses tab. The question will simply no longer appear for new patients going through onboarding.',
   1, now()),

  (gen_random_uuid(), ca_guide_onboarding,
   'Can I make an onboarding question optional?',
   'Yes. When creating or editing a question, toggle the "Required" switch to off. Optional questions appear to patients during onboarding but do not block completion if left unanswered.',
   2, now()),

  (gen_random_uuid(), ca_guide_onboarding,
   'What happens to onboarding if I add a new required question after some patients have already completed it?',
   'Patients who completed onboarding before the new question was added will have their status changed back to "In Progress" and will be prompted to answer the new question on their next login. This ensures all patients have provided complete information.',
   3, now()),

  (gen_random_uuid(), ca_guide_onboarding,
   'Is there a limit to how many onboarding questions I can add?',
   'There is no hard system limit. However, MediFlow recommends keeping your onboarding concise to improve patient completion rates. Clinics with more than 20 required questions typically see lower onboarding completion. Consider making non-critical questions optional.',
   4, now());


  -- ===========================================================================
  -- PRACTITIONER FAQS
  -- ===========================================================================

  INSERT INTO public.help_guide_faqs (id, guide_id, question, answer, sort_order, created_at) VALUES

  -- Getting Started as a Practitioner FAQs
  (gen_random_uuid(), pr_guide_getting_started,
   'I activated my account but I cannot log in. What should I do?',
   'Make sure you are selecting "Practitioner" as the account type on the login screen. If you are still unable to log in, click "Forgot Password" to reset your credentials. If the issue persists, contact your clinic administrator to verify that your account is active.',
   1, now()),

  (gen_random_uuid(), pr_guide_getting_started,
   'Can I update my own schedule in MediFlow?',
   'Schedule changes (working days, hours, and assigned services) are managed by your clinic administrator. If you need to adjust your availability, contact your clinic admin and they can update your schedule in the practitioner management section.',
   2, now()),

  (gen_random_uuid(), pr_guide_getting_started,
   'I work at two clinics that both use MediFlow. Do I need two separate accounts?',
   'Yes. Each clinic manages its own practitioner accounts independently. You will have a separate login for each clinic. Appointment histories, patients, and schedules are kept entirely separate between clinics.',
   3, now()),

  -- Managing Your Schedule FAQs
  (gen_random_uuid(), pr_guide_schedule,
   'My calendar shows open slots but patients say they cannot book those times. Why?',
   'This can happen if the service you are assigned to does not have those time slots configured, or if your schedule was recently updated and the change has not propagated. Check with your clinic administrator to confirm your schedule settings are correct.',
   1, now()),

  (gen_random_uuid(), pr_guide_schedule,
   'Can I block out time on my calendar for personal reasons without involving the clinic admin?',
   'Currently, only clinic administrators can modify practitioner schedules. If you need time blocked (e.g., for a meeting or personal appointment), contact your clinic admin with the date and time range and they can update your schedule accordingly.',
   2, now()),

  (gen_random_uuid(), pr_guide_schedule,
   'How far in advance can patients book appointments with me?',
   'The booking window is configured by your clinic administrator. Contact your clinic admin if you want to adjust how far in advance patients can schedule appointments.',
   3, now()),

  -- Patient Interactions FAQs
  (gen_random_uuid(), pr_guide_patient_interact,
   'Can I see a patient''s records from appointments they had at another clinic?',
   'No. MediFlow strictly partitions patient data by clinic. You can only see appointments and records for patients within your own clinic. This protects patient privacy and maintains clear data boundaries between healthcare providers.',
   1, now()),

  (gen_random_uuid(), pr_guide_patient_interact,
   'A patient claims they uploaded a referral letter but I cannot see it in their documents tab. What should I check?',
   'Confirm that the document upload was completed by asking the patient to check their profile under Documents. If the upload was successful, verify with your clinic administrator that the required document type is correctly configured in your clinic''s onboarding settings.',
   2, now()),

  (gen_random_uuid(), pr_guide_patient_interact,
   'Can I add clinical notes to an appointment?',
   'Clinical note-taking within MediFlow is an AI-assisted feature available on Professional and Enterprise plans. If your clinic has this feature enabled, you will see a "Notes" section in the appointment detail panel. Contact your clinic administrator to confirm whether this feature is active.',
   3, now()),

  -- Appointment Management FAQs
  (gen_random_uuid(), pr_guide_appointments,
   'What is the difference between "Completed" and "No-Show"?',
   '"Completed" means the patient attended the appointment and the visit took place. "No-Show" means the patient had a confirmed appointment but did not attend and did not cancel in advance. Use the correct status to keep your clinic''s attendance records accurate.',
   1, now()),

  (gen_random_uuid(), pr_guide_appointments,
   'Can I confirm an appointment that was already confirmed by the clinic admin?',
   'Appointments can only be confirmed once. If a clinic admin has already confirmed an appointment, its status shows as "Confirmed" and no further confirmation action is needed. You can still view the full appointment details and take subsequent actions (Completed, No-Show) after the visit.',
   2, now()),

  (gen_random_uuid(), pr_guide_appointments,
   'I accidentally marked an appointment as No-Show but the patient actually attended. Can I undo this?',
   'Once an appointment is marked as No-Show, you cannot change the status yourself. Contact your clinic administrator — they can update the appointment status from the clinic admin portal.',
   3, now()),

  (gen_random_uuid(), pr_guide_appointments,
   'Will patients be notified when I confirm their appointment?',
   'Yes, if the patient has appointment confirmation notifications enabled in their settings and your clinic has confirmation notifications turned on in Clinic Settings. The patient will receive either an email, an in-app notification, or both, depending on their preferences.',
   4, now());

END $$;
