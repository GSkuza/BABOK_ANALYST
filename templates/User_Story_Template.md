# User Story Template

**Epic:** [Epic Name]  
**Feature:** [Feature Name]  
**Story ID:** US-[###]  
**Priority:** Must Have | Should Have | Could Have | Won't Have

---

## User Story

**As a** [type of user/role]  
**I want** [goal/desire]  
**So that** [benefit/value]

---

## Acceptance Criteria

### Scenario 1: [Scenario Name]
**Given** [initial context/precondition]  
**When** [event/action occurs]  
**Then** [expected outcome/result]  
**And** [additional outcome, if applicable]

### Scenario 2: [Scenario Name]
**Given** [initial context/precondition]  
**When** [event/action occurs]  
**Then** [expected outcome/result]

### Scenario 3: [Negative/Edge Case]
**Given** [initial context/precondition]  
**When** [invalid action occurs]  
**Then** [expected error handling/result]

---

## Definition of Done

- [ ] Code complete and peer reviewed
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] User acceptance testing completed
- [ ] Documentation updated
- [ ] Deployed to staging environment
- [ ] Approved by Product Owner
- [ ] No critical bugs outstanding

---

## Additional Details

### Business Value
[Explanation of why this story matters to the business]

### Dependencies
- [Dependency 1]
- [Dependency 2]

### Assumptions
- [Assumption 1]
- [Assumption 2]

### Technical Notes
[Any technical considerations, constraints, or implementation notes]

---

## Estimation

**Story Points:** [Points]  
**Estimated Hours:** [Hours]  
**Sprint:** [Sprint Number]

---

## Attachments

- [Wireframes/Mockups]
- [Related Documents]
- [Reference Materials]

---

## Testing Notes

### Test Scenarios
1. [Test scenario 1]
2. [Test scenario 2]
3. [Edge case scenario]

### Test Data Requirements
- [Test data 1]
- [Test data 2]

---

## Comments & Discussion

| Date | Author | Comment |
|------|--------|---------|
| [Date] | [Name] | [Comment] |

---

## Status Tracking

**Status:** Backlog | In Progress | In Review | Testing | Done  
**Assigned To:** [Developer Name]  
**Created:** [Date]  
**Started:** [Date]  
**Completed:** [Date]

---

## Example User Stories

### Example 1: Authentication
**As a** registered user  
**I want** to log into the system with my email and password  
**So that** I can access my personalized dashboard

**Acceptance Criteria:**
- **Given** I am on the login page and have a valid account  
  **When** I enter my correct email and password and click "Login"  
  **Then** I should be redirected to my dashboard
  
- **Given** I am on the login page  
  **When** I enter an incorrect password  
  **Then** I should see an error message "Invalid credentials"  
  **And** remain on the login page

### Example 2: Data Export
**As a** business analyst  
**I want** to export report data to CSV format  
**So that** I can analyze it in Excel

**Acceptance Criteria:**
- **Given** I am viewing a report with data  
  **When** I click the "Export to CSV" button  
  **Then** a CSV file should be downloaded to my computer  
  **And** contain all visible report data with proper headers

### Example 3: Notification Settings
**As a** system administrator  
**I want** to configure email notification preferences  
**So that** users receive relevant alerts without being overwhelmed

**Acceptance Criteria:**
- **Given** I am on the notification settings page  
  **When** I select notification types and save  
  **Then** the system should save my preferences  
  **And** send notifications according to my settings
