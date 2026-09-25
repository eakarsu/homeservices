# September 18 feature implementation

Provider choices: Stripe payments and subscriptions; Twilio SMS and telephone intake.
Target company requested by owner: Norshin (resolve existing company before binding live account).

Work in progress:
- [x] SMTP transport and correct account-email recipients; truthful retry responses
- [x] Manager-only provider connection checks and webhook setup guidance
- [ ] Public booking / incoming-message inbox with editable AI-assisted booking review
- [ ] Signed Twilio SMS and speech intake, caller notice, human handoff
- [ ] Approved reminders scheduling and booking confirmation drafts
- [ ] Offline technician notes, checklist and photos with explicit synchronization
- [ ] Voice notes to reviewed job reports
- [ ] Maintenance billing drafts, accounting sync, road routing
- [ ] Supplier order documents, warranty packets and evidence-based AI drafting
- [ ] Integration tests and office/technician/customer acceptance
- [ ] Hostinger release and Norshin Stripe configuration

External setup still required: real Twilio account, auth token and sender number; SMTP credentials; software subscription prices and billing terms; accounting and map credentials.
