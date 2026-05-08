# Security Specification for Biblical App

## Data Invariants
1. A prayer request must have a valid `userId` matching the creator.
2. `prayedCount` can only be incremented when a user adds a record to the `prays` subcollection (relational integrity).
3. A user can only join a `sharedPlan` if they are adding themselves (not spoofing).
4. Progress in a shared plan can only be updated by the owner of that progress record.
5. Comments can only be posted by members of the shared plan.

## The Dirty Dozen Payloads

1. **Identity Spoofing**: Creating a prayer request with `userId: "malicious_user"` while auth is `victim_user`.
2. **State Shortcut**: Updating `prayedCount` to 9999 without actually pinning a `pray` record.
3. **Resource Poisoning**: Large string (1MB) as a prayer text.
4. **Member Hijack**: Adding another user to a shared plan without their consent.
5. **Progress Spoof**: Marking a task as "completed" for another user in a shared plan.
6. **Orphaned Writes**: Creating a `pray` record for a `prayerId` that doesn't exist.
7. **Ghost Comments**: Posting a comment to a shared plan the user is NOT a member of.
8. **Shadow Field**: Adding `isAdmin: true` to a user profile update.
9. **Update Gap**: Changing the `userId` of an existing prayer request to "orphan" it.
10. **Timestamp Fraud**: Setting `createdAt` to a future date instead of `request.time`.
11. **PII Leak**: Querying for all users' emails without specific permissions.
12. **Recursive Cost Attack**: Attempting to list all `prays` subcollections across all prayers in a single query (Rule-level blockage).

## Red Team Checklist
- [ ] Can I set `ownerId` to someone else?
- [ ] Can I skip a status step (e.g. mark plan as finished)?
- [ ] Can I inject 1MB junk?
- [ ] Can I edit another user's progress?
- [ ] Can I delete a prayer I didn't create?
