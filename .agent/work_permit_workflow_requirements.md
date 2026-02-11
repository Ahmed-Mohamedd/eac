# 📋 Work Permit Workflow Requirements & Implementation Plan

**Created:** February 9, 2026  
**Status:** 🔴 To Be Implemented

---

## 🎯 Business Requirement

Enforce a strict workflow for work permit processing to ensure safety compliance:

### Current Workflow (Problematic)
```
User creates permit → Admin can change status immediately (❌ Unsafe)
```

### Required Workflow (Enforced)
```
1. User creates permit (Status: Pending)
   ↓
2. S&H Representative signs permit (isSigned = true)
   ↓
3. Admin/Supervisor can review and change status (✅ Safe)
```

**Key Rule:** Admins/Supervisors **cannot** change the status from "Pending" until S&H has signed the permit.

---

## 📊 Workflow States

| Step | Actor | Action | Status | isSigned | Can Change Status? |
|------|-------|--------|--------|----------|-------------------|
| 1 | Normal User | Create permit | Pending | `false` | ❌ No |
| 2 | S&H User | Sign permit | Pending | `true` | ❌ Not yet |
| 3 | Admin/Supervisor | Review & approve | Any status | `true` | ✅ Yes |

---

## 🔒 Business Rules

### Rule 1: Status Change Validation
**Backend must validate:**
```typescript
// Pseudo-code
if (changingStatus && currentStatus === 'Pending' && !isSigned) {
    throw new ValidationException("Cannot change status until S&H signs permit");
}
```

**Exception:** Status can only change from "Pending" if:
- Permit is already signed (`isSigned === true`), OR
- Status is being set to "Cancelled" or "Rejected" (administrative override)

### Rule 2: Role-Based Actions
| Role | Can Create | Can Sign | Can Change Status |
|------|-----------|----------|-------------------|
| Normal User | ✅ Yes | ❌ No | ❌ No |
| S&H Representative | ✅ Yes | ✅ Yes | ❌ No |
| Admin/Supervisor | ✅ Yes | ❌ No | ✅ Yes (if signed) |

---

## 🛠️ Implementation Requirements

### Backend Changes (C# / ASP.NET Core)

#### 1. Update `UpdateWorkPermitStatusCommand` Validator
**File:** `Application/Features/WorkPermits/Commands/UpdateWorkPermitStatus/UpdateWorkPermitStatusCommandValidator.cs`

**Add validation rule:**
```csharp
RuleFor(x => x)
    .MustAsync(async (command, cancellation) => 
    {
        var permit = await context.WorkPermits
            .FirstOrDefaultAsync(p => p.Id == command.WorkPermitId, cancellation);
        
        if (permit == null) return false;
        
        // If current status is Pending and trying to change to another status
        if (permit.WorkPermitStatusId == 1 && command.StatusId != 1) // Assuming 1 = Pending
        {
            // Must be signed, unless changing to Cancelled/Rejected
            if (!permit.IsSigned && command.StatusId != 6 && command.StatusId != 5) 
            {
                return false;
            }
        }
        
        return true;
    })
    .WithMessage("لا يمكن تغيير حالة التصريح حتى يتم توقيعه من قبل ممثل السلامة والصحة المهنية")
    .WithErrorCode("WP-005-007");
```

#### 2. Add New Error Code
**File:** `Domain/Enums/ErrorCode.cs`

```csharp
/// <summary>Cannot change permit status before S&H signature</summary>
StatusChangeRequiresSignature = 5007, // WP-005-007
```

**Update `ErrorCodeExtensions`:**
```csharp
case ErrorCode.StatusChangeRequiresSignature:
    return "Status Change Requires Signature";
```

#### 3. Update Handler Documentation
**File:** `UpdateWorkPermitStatusCommandHandler.cs`

Add XML comment:
```csharp
/// <summary>
/// Updates work permit status
/// Business Rule: Status cannot be changed from Pending unless permit is signed by S&H
/// Exception: Cancellation and Rejection can be done without signature
/// </summary>
```

---

### Frontend Changes (Angular)

#### 1. Disable Status Dropdown Until Signed
**File:** `work-permit-detail.component.html`

```html
<!-- Status dropdown/select -->
<select 
    [disabled]="!canChangeStatus()"
    [(ngModel)]="selectedStatusId"
    (change)="updateStatus()">
    <!-- options -->
</select>
```

**Component method:**
```typescript
canChangeStatus(): boolean {
    // Must be Admin or Supervisor
    if (!this.authService.hasRole('Admin') && !this.authService.hasRole('Supervisor')) {
        return false;
    }
    
    // If status is Pending, must be signed first
    if (this.permit?.workPermitStatusId === 1 && !this.permit?.isSigned) {
        return false;
    }
    
    return true;
}
```

#### 2. Add Visual Indicator
**Show warning message when status change is blocked:**

```html
<div class="warning-box" *ngIf="isStatusChangeBlocked()">
    <svg><!-- warning icon --></svg>
    <p>
        <strong>تنبيه:</strong>
        لا يمكن تغيير حالة التصريح حتى يتم توقيعه من قبل ممثل السلامة والصحة المهنية
    </p>
</div>
```

```typescript
isStatusChangeBlocked(): boolean {
    return this.permit?.workPermitStatusId === 1 && 
           !this.permit?.isSigned && 
           this.isAdminOrSupervisor();
}
```

#### 3. Update Error Translation
**File:** `assets/i18n/ar.json`

```json
{
    "errors": {
        "WP-005-007": "لا يمكن تغيير حالة التصريح حتى يتم توقيعه من قبل ممثل السلامة والصحة المهنية"
    }
}
```

---

## 🧪 Testing Checklist

### Backend Tests
- [ ] Test status update from Pending → Approved when **not signed** (should fail)
- [ ] Test status update from Pending → Approved when **signed** (should succeed)
- [ ] Test status update from Pending → Cancelled when **not signed** (should succeed - override)
- [ ] Test status update from In-Progress → Completed (should succeed regardless of signing)
- [ ] Verify error code WP-005-007 is returned
- [ ] Verify error message is translated correctly

### Frontend Tests
- [ ] Verify status dropdown is disabled for unsigned Pending permits (Admin view)
- [ ] Verify status dropdown is enabled after S&H signs
- [ ] Verify warning message appears when blocked
- [ ] Verify non-admin users cannot see status options at all
- [ ] Test error interceptor shows correct Arabic message

### End-to-End Flow
1. [ ] User creates permit → Status = Pending, isSigned = false
2. [ ] Admin tries to change status → Should be blocked (UI disabled)
3. [ ] S&H user signs permit → isSigned = true
4. [ ] Admin changes status → Should succeed
5. [ ] Verify email notifications work correctly

---

## 📝 Database Considerations

### Check Current Status IDs
Verify status mappings in database:
```sql
SELECT Id, NameEn, NameAr 
FROM WorkPermitStatuses 
ORDER BY Id;
```

**Expected statuses:**
- 1 = Pending (قيد الانتظار)
- 2 = Approved (موافق عليه)
- 3 = In Progress (قيد التنفيذ)
- 4 = Completed (مكتمل)
- 5 = Rejected (مرفوض)
- 6 = Cancelled (ملغي)

---

## 🎨 UI/UX Improvements

### Visual Cues for Workflow State

**1. Pending + Unsigned:**
```
┌─────────────────────────────────────┐
│ ⚠️  Awaiting S&H Signature          │
│ This permit must be signed before   │
│ status can be changed               │
└─────────────────────────────────────┘
```

**2. Pending + Signed:**
```
┌─────────────────────────────────────┐
│ ✅ Signed - Ready for Review        │
│ Status can now be updated           │
└─────────────────────────────────────┘
```

**3. Status Dropdown States:**
- **Disabled:** Gray with lock icon
- **Enabled:** Normal with dropdown arrow
- **Tooltip:** "يتطلب توقيع السلامة والصحة المهنية" when disabled

---

## 🔄 Migration Path

### For Existing Permits

**Question:** What about permits already in the database that are Pending but not signed?

**Options:**
1. **Strict:** Require all existing Pending permits to be signed
2. **Grandfather:** Only apply rule to new permits (created after date X)
3. **Batch Sign:** Auto-sign all existing pending permits by a designated S&H user

**Recommendation:** Option 3 (Batch sign with audit log entry)

```sql
-- Example migration script
UPDATE WorkPermits 
SET IsSigned = 1,
    OccupationalSafetyRepresentativeId = @DefaultShUserId,
    UpdatedAt = GETUTCDATE(),
    UpdatedById = @SystemUserId
WHERE WorkPermitStatusId = 1 
  AND IsSigned = 0
  AND CreatedAt < '2026-02-10'; -- Before workflow change
```

---

## 📊 Success Metrics

### Compliance Tracking
- % of permits signed before status change
- Average time between creation and signing
- Number of blocked status change attempts
- S&H user engagement rate

### Dashboards to Update
- Add "Unsigned Permits" count to dashboard
- Add "Awaiting Signature" filter to permit list
- Show signing rate trends

---

## 🚀 Implementation Priority

### Phase 1: Backend (Critical) ⚠️
1. Add validation rule
2. Add error code
3. Test thoroughly
4. Deploy to backend

### Phase 2: Frontend (High Priority) 📱
1. Disable status change UI
2. Add warning messages
3. Add visual indicators
4. Update translations

### Phase 3: Migration (If Needed) 📦
1. Batch sign existing permits
2. Add audit logging
3. Notify affected users

### Phase 4: Monitoring (Ongoing) 📈
1. Track compliance metrics
2. Monitor user feedback
3. Adjust workflow if needed

---

## 💡 Additional Considerations

### Edge Cases
1. **What if S&H user is unavailable?**
   - Admin override capability? (requires special permission)
   - Backup S&H designee?

2. **What if permit needs urgent cancellation?**
   - Cancellation/Rejection should bypass signature requirement

3. **What about permit edits?**
   - Unsigned permit: Can edit freely
   - Signed permit: Requires re-signature after major edits?

### Future Enhancements
- Multi-level approval workflow
- Time-based auto-escalation
- Mobile push notifications for S&H signing
- Digital signature integration
- Audit trail for all status changes

---

## 📋 Summary

**What:** Enforce S&H signature before status changes  
**Why:** Safety compliance and proper workflow  
**How:** Backend validation + Frontend UI restrictions  
**When:** Phase 1 (Backend) should be implemented ASAP  

**Next Steps:**
1. Review this document with stakeholders
2. Confirm status ID mappings
3. Decide on migration strategy
4. Implement backend validation
5. Update frontend UI
6. Test thoroughly
7. Deploy and monitor

---

**Document Owner:** Development Team  
**Last Updated:** February 9, 2026  
**Review Date:** After implementation
