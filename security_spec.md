# Firestore Security Specification (Phase 0)

## 1. Data Invariants
1. **Strict Ownership**: A user preferences document at `/users/{userId}` can only be read, created, or updated by the verified user whose `request.auth.uid == userId` and `request.auth.token.email_verified == true`.
2. **Signal Ownership & Parent Sync**: A signal record at `/users/{userId}/signals/{signalId}` belongs exclusively to `{userId}`. Every write validates `ownerId == request.auth.uid` and `signalId == signalId` path parameter.
3. **Immutable Audit Fields**: `ownerId`, `createdAt`, and `signalId` cannot be altered after creation.
4. **Server Timestamp Integrity**: `createdAt` and `updatedAt` must strictly equal `request.time`.
5. **Bounded Payloads**: All strings, enums, numbers, and arrays (`macroCatalysts.size() <= 6`) are bounded to prevent resource exhaustion.

## 2. Dirty Dozen Adversarial Payloads (Must Return PERMISSION_DENIED)
1. Unauthenticated read of `/users/uid1/signals/sig_1`.
2. Unverified email user (`email_verified: false`) writing `/users/uid1`.
3. Cross-user read (`uid2` reading `/users/uid1`).
4. Cross-user signal creation (`uid2` writing `/users/uid1/signals/sig_1` with `ownerId: "uid1"`).
5. Identity spoofing (`uid1` writing `/users/uid1` with `ownerId: "uid2"`).
6. Ghost/shadow field injection (`isAdmin: true` in `/users/uid1`).
7. Oversized path ID poisoning (`signalId` > 128 chars or containing invalid symbols).
8. Client-forged `createdAt` timestamp not equal to `request.time`.
9. Mutating `ownerId` or `createdAt` during an update to `/users/uid1`.
10. Invalid enum value for `bias` (`"ALL_IN"`) or `timeframe` (`"99m"`) in `SignalRecord`.
11. Unbounded `macroCatalysts` list (`> 6` items) or non-string first element.
12. Oversized `technicalSummary` (`> 2000` characters) causing resource poisoning.
