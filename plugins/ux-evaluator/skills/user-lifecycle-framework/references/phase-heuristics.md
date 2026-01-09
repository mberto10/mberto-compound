# Phase-Specific Evaluation Heuristics

Detailed evaluation criteria for each User Lifecycle phase. Use these heuristics when assessing user experience at each stage.

---

## DISCOVER Phase

**User Question:** "Why should I care?"
**Goal:** Communicate value, convert visitors

### Entry Points
- Landing page
- Marketing pages
- Product hunt / app store listings
- Shared links

### Evaluation Criteria

#### Value Proposition (Weight: High)
- [ ] Clear headline communicating core benefit
- [ ] Subheadline expanding on the value
- [ ] Above-the-fold value visible without scrolling
- [ ] Benefit-focused (not feature-focused) messaging

#### Social Proof (Weight: Medium)
- [ ] Testimonials or reviews visible
- [ ] Usage numbers or customer logos
- [ ] Trust badges or certifications
- [ ] Case studies or success stories accessible

#### Call to Action (Weight: High)
- [ ] Primary CTA is prominent and clear
- [ ] CTA text is action-oriented ("Start free" vs "Submit")
- [ ] Single primary action (not competing CTAs)
- [ ] CTA visible without scrolling

#### Visual Hierarchy (Weight: Medium)
- [ ] Eye flow guides to key information
- [ ] Whitespace used effectively
- [ ] Images support message (not decoration)
- [ ] Mobile-responsive layout

#### Load Performance (Weight: Medium)
- [ ] Page loads in <3 seconds
- [ ] No layout shift during load
- [ ] Images optimized
- [ ] Critical content loads first

### Common Issues
- Value proposition buried below fold
- Feature list instead of benefits
- Multiple competing CTAs
- Jargon-heavy copy
- Slow page load

---

## SIGN UP Phase

**User Question:** "Let me in"
**Goal:** Frictionless authentication

### Entry Points
- Sign up button/link
- Pricing page CTA
- Gated content trigger

### Evaluation Criteria

#### Form Simplicity (Weight: Critical)
- [ ] Minimal required fields (ideal: email + password only)
- [ ] Optional fields clearly marked
- [ ] No unnecessary information requested
- [ ] Progressive profiling (collect more later)

#### Social Authentication (Weight: High)
- [ ] Social sign-up options available (Google, GitHub, etc.)
- [ ] Social options prominent (not hidden)
- [ ] Clear account linking explanation

#### Password Requirements (Weight: High)
- [ ] Requirements shown before/during entry
- [ ] Real-time validation feedback
- [ ] Requirements are reasonable
- [ ] Show/hide password toggle

#### Error Handling (Weight: Critical)
- [ ] Inline field validation
- [ ] Clear error messages (not codes)
- [ ] Errors appear near relevant field
- [ ] Form preserves entered data on error

#### Trust Signals (Weight: Medium)
- [ ] Privacy policy linked
- [ ] Security indicators (HTTPS, lock icon)
- [ ] No spam promise
- [ ] Data usage explanation

#### Accessibility (Weight: High)
- [ ] Labels associated with inputs
- [ ] Error messages announced to screen readers
- [ ] Keyboard navigation works
- [ ] Focus states visible

### Common Issues
- Too many required fields
- Password requirements not shown until error
- Generic error messages ("Something went wrong")
- No social auth options
- Form clears on validation error

### Metrics to Note
- Field count
- Estimated completion time
- Number of clicks to complete

---

## ONBOARD Phase

**User Question:** "Help me get started"
**Goal:** Guide through initial setup

### Entry Points
- Post-signup redirect
- First login experience
- Welcome email link

### Evaluation Criteria

#### Progress Indication (Weight: High)
- [ ] Clear step indicator (1 of 4, progress bar)
- [ ] Steps are logical sequence
- [ ] Can see what's coming next
- [ ] Completion feels achievable

#### Task Clarity (Weight: Critical)
- [ ] Each step has clear instruction
- [ ] Actions are obvious
- [ ] Help text available but not overwhelming
- [ ] Examples provided where helpful

#### Skip Options (Weight: Medium)
- [ ] Non-essential steps skippable
- [ ] Skip option visible but not prominent
- [ ] Can return to skipped steps later
- [ ] Core path doesn't require all steps

#### Contextual Help (Weight: Medium)
- [ ] Tooltips for complex fields
- [ ] Help links to documentation
- [ ] Chat/support accessible
- [ ] FAQ for common questions

#### Personalization (Weight: Medium)
- [ ] Asks about use case/goals
- [ ] Adapts flow based on answers
- [ ] Remembers preferences
- [ ] Relevant defaults suggested

#### Recovery (Weight: High)
- [ ] Can go back to previous steps
- [ ] Progress saved automatically
- [ ] Can resume later
- [ ] Clear exit path if needed

### Common Issues
- No progress indicator
- Mandatory steps that feel optional
- Overwhelming information dump
- No way to skip ahead
- Progress lost on navigation

### Metrics to Note
- Number of onboarding steps
- Time to complete onboarding
- Skip rate per step

---

## ACTIVATE Phase

**User Question:** "Aha! This is useful"
**Goal:** Deliver first value moment

### Entry Points
- Onboarding completion
- First feature interaction
- Template/sample selection

### Evaluation Criteria

#### Time to Value (Weight: Critical)
- [ ] First meaningful action possible quickly
- [ ] Value delivered within first session
- [ ] No extensive setup required for basics
- [ ] Quick wins are accessible

#### Success Moment (Weight: Critical)
- [ ] Clear indication of successful completion
- [ ] Celebration of achievement (subtle)
- [ ] Result is visible and meaningful
- [ ] User understands what they accomplished

#### Guidance to Action (Weight: High)
- [ ] Clear next step suggested
- [ ] Templates or examples available
- [ ] Empty states guide to action
- [ ] No dead ends

#### Feature Discovery (Weight: Medium)
- [ ] Core features highlighted
- [ ] Advanced features discoverable but not overwhelming
- [ ] Tooltips introduce new elements
- [ ] Feature hints contextual

#### Feedback Loop (Weight: High)
- [ ] Actions have visible results
- [ ] Loading states present
- [ ] Success/error states clear
- [ ] Undo available for risky actions

### Common Issues
- Too much setup before first value
- Activation buried in features
- No celebration of success
- Empty state without guidance
- Value moment unclear

### Metrics to Note
- Time from signup to first value
- Actions required to reach activation
- Success rate of activation flow

---

## ADOPT Phase

**User Question:** "This is how I use it"
**Goal:** Establish core usage loop

### Entry Points
- Post-activation return
- Regular session start
- Core workflow entry

### Evaluation Criteria

#### Core Loop Clarity (Weight: Critical)
- [ ] Primary workflow is obvious
- [ ] Steps are repeatable and consistent
- [ ] Shortcuts available for frequent actions
- [ ] Loop can be completed efficiently

#### Muscle Memory (Weight: High)
- [ ] Consistent interaction patterns
- [ ] Keyboard shortcuts available
- [ ] Actions in expected locations
- [ ] Minimal cognitive load

#### Efficiency Features (Weight: Medium)
- [ ] Bulk actions available
- [ ] Templates for common tasks
- [ ] Recent/favorites accessible
- [ ] Search works well

#### Error Prevention (Weight: High)
- [ ] Confirmation for destructive actions
- [ ] Undo available
- [ ] Draft/autosave present
- [ ] Validation prevents mistakes

#### Learning Curve (Weight: Medium)
- [ ] Power features discoverable over time
- [ ] Tips appear contextually
- [ ] Documentation accessible
- [ ] Help doesn't interrupt flow

### Common Issues
- Core loop requires too many steps
- Inconsistent UI patterns
- No shortcuts for power users
- Frequent errors in main workflow
- Features hidden or hard to find

### Metrics to Note
- Steps in core loop
- Time to complete core action
- Error rate in main workflow

---

## ENGAGE Phase

**User Question:** "I check this regularly"
**Goal:** Build habit, bring users back

### Entry Points
- Email notifications
- Push notifications
- Dashboard/home return

### Evaluation Criteria

#### Return Triggers (Weight: High)
- [ ] Notifications are valuable (not spammy)
- [ ] Email content compelling
- [ ] Deep links go to relevant content
- [ ] Notification preferences available

#### Session Start (Weight: High)
- [ ] Dashboard shows what's new/relevant
- [ ] Quick actions accessible
- [ ] Personalized content prominent
- [ ] Clear value in returning

#### Engagement Hooks (Weight: Medium)
- [ ] New content/features highlighted
- [ ] Progress/streaks shown
- [ ] Social elements present
- [ ] Gamification (if appropriate)

#### Notification Management (Weight: Medium)
- [ ] Easy to adjust frequency
- [ ] Channel preferences (email/push)
- [ ] Unsubscribe respects choice
- [ ] Smart defaults

### Common Issues
- Notification overload
- Dashboard shows stale content
- No reason to return regularly
- Deep links broken
- No personalization

### Metrics to Note
- Return frequency
- Session duration
- Notification interaction rate

---

## RETAIN Phase

**User Question:** "I can't work without this"
**Goal:** Demonstrate ongoing value

### Entry Points
- Long-term usage patterns
- Billing/renewal moments
- Usage reports/summaries

### Evaluation Criteria

#### Value Demonstration (Weight: Critical)
- [ ] Usage reports available
- [ ] ROI/impact visible
- [ ] Progress over time shown
- [ ] Achievements/milestones celebrated

#### Investment Protection (Weight: High)
- [ ] Data export available
- [ ] Integration depth grows over time
- [ ] Customization preserved
- [ ] History/audit trail accessible

#### Support Quality (Weight: High)
- [ ] Help is accessible
- [ ] Response time reasonable
- [ ] Issues resolved effectively
- [ ] Proactive communication

#### Reliability (Weight: Critical)
- [ ] Uptime is excellent
- [ ] Performance consistent
- [ ] No data loss incidents
- [ ] Status page available

### Common Issues
- No usage insights provided
- Data feels locked in
- Support hard to reach
- Reliability issues
- No progress visibility

---

## EXPAND Phase

**User Question:** "I want more"
**Goal:** Growth, upgrades, referrals

### Entry Points
- Usage limits reached
- Plan comparison page
- Referral program entry
- Feature gates

### Evaluation Criteria

#### Upgrade Path (Weight: High)
- [ ] Plan comparison clear
- [ ] Benefits of upgrade obvious
- [ ] Pricing transparent
- [ ] Upgrade process simple

#### Usage Limits (Weight: Medium)
- [ ] Limits shown before hitting them
- [ ] Warning before hard block
- [ ] Graceful degradation
- [ ] Clear path to resolve

#### Referral Program (Weight: Medium)
- [ ] Easy to share/invite
- [ ] Benefits clear for both parties
- [ ] Tracking visible
- [ ] Rewards delivered promptly

#### Expansion Features (Weight: Medium)
- [ ] Advanced features discoverable
- [ ] Team/collaboration options
- [ ] API/integration possibilities
- [ ] Enterprise options visible

### Common Issues
- Upgrade path unclear
- Hard limits without warning
- Complex pricing tiers
- Referral program hidden
- No growth path visible

---

## Cross-Phase Heuristics

These apply to all phases:

### Accessibility
- [ ] Screen reader compatible
- [ ] Keyboard navigable
- [ ] Color contrast sufficient
- [ ] Focus states visible
- [ ] Alt text for images

### Performance
- [ ] Pages load quickly (<3s)
- [ ] Interactions responsive (<100ms)
- [ ] No layout shift
- [ ] Works on slow connections

### Mobile Experience
- [ ] Touch targets adequate (44px+)
- [ ] Content readable without zoom
- [ ] No horizontal scroll
- [ ] Forms work on mobile

### Error Handling
- [ ] Errors are human-readable
- [ ] Recovery path clear
- [ ] State preserved on error
- [ ] Support contact available

### Consistency
- [ ] Visual design consistent
- [ ] Interaction patterns consistent
- [ ] Terminology consistent
- [ ] Behavior predictable
