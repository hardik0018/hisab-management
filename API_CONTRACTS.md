# API Contracts & Endpoints

This document maps all active, functional REST API endpoints in the **Hisab Management** system.

---

## Authentication Requirements
All endpoints except `/api/auth/*` and root redirects require authentication. Authenticated endpoints use standard NextAuth session cookies. If a request is unauthorized, the API returns:
*   **Status**: `401 Unauthorized`
*   **Payload**: `{ "error": "Unauthorized", "message": "You must be logged in" }` (or similar)

---

## Endpoints List

| Method | Route | Purpose | Auth | Request | Response | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | Retrieve metrics and recent items | Yes | None | `200 OK`<br>`{ "totalExpense": 0, "totalDebit": number, "totalCredit": number, "totalMarriage": number, "balance": number, "recentExpenses": [], "recentHisab": HisabRecord[] }` | Queries collections `hisab` and `marriage_hisab` aggregated by `space_id`. |
| `POST` | `/api/expenses` | Save bulk lists of expenses | Yes | `200 OK`<br>`{ "expenses": [ { "date": "YYYY-MM-DD", "itemName": string, "amount": number, "note"?: string, "category"?: string } ] }` | `221 Created`<br>`{ "success": true, "count": number }` | Validates each expense using `validateExpense()`. Saves using `insertMany`. |
| `PATCH` | `/api/expenses/[id]` | Edit an individual expense item | Yes | `200 OK`<br>`{ "itemName"?: string, "amount"?: number, "note"?: string, "date"?: "YYYY-MM-DD" }` | `200 OK`<br>`{ "expense": Expense }` | Constrained by `_id` and active `space_id`. Re-validates data before saving. |
| `DELETE` | `/api/expenses/[id]` | Remove an individual expense | Yes | None | `200 OK`<br>`{ "success": true }` | Scopes delete to the active `space_id`. Returns `404` if the item is missing. |
| `POST` | `/api/expenses/parse` | Parse multi-line raw text blocks | Yes | `200 OK`<br>`{ "text": string, "datePickerDate": "YYYY-MM-DD" }` | `200 OK`<br>`{ "result": ParseResult }` | Analyzes list structures, matches regex, sets large expense flags, and flags date conflicts. |
| `GET` | `/api/hisab` | List all credit/debit logs | Yes | None | `200 OK`<br>`{ "records": HisabRecord[] }` | Sorted descending by transaction `date`. |
| `POST` | `/api/hisab` | Log a new credit/debit transaction | Yes | `201 Created`<br>`{ "name": string, "mobile"?: string, "type": "credit" \| "debit", "amount": number, "description"?: string, "date"?: Date, "logAsExpense"?: boolean }` | `201 Created`<br>`{ "record": HisabRecord }` | Generates prefix `hsb_`. **Side Effect**: If `logAsExpense` is true, inserts a duplicate record into `expenses` collection. |
| `PUT` | `/api/hisab/[id]` | Edit credit/debit records | Yes | `200 OK`<br>`{ "name"?: string, "mobile"?: string, "type"?: "credit" \| "debit", "amount"?: number, "description"?: string, "date"?: Date, "logAsExpense"?: boolean }` | `200 OK`<br>`{ "record": HisabRecord }` | Updates record. **Side Effect**: If `logAsExpense` shifts status or values, syncs or deletes matching linked item in `expenses`. |
| `DELETE` | `/api/hisab/[id]` | Remove credit/debit transactions | Yes | None | `200 OK`<br>`{ "success": true }` | Removes ledger item. **Side Effect**: Deletes any linked associated record from `expenses` matching `associatedId`. |
| `GET` | `/api/marriage` | List all event Vayvhar cash gifts | Yes | None | `200 OK`<br>`{ "records": MarriageRecord[] }` | Sorted descending by date. |
| `POST` | `/api/marriage` | Log a new Vayvhar gift | Yes | `201 Created`<br>`{ "name": string, "city"?: string, "amount": number, "date"?: Date, "logAsExpense"?: boolean }` | `201 Created`<br>`{ "record": MarriageRecord }` | Generates prefix `mar_`. **Side Effect**: If `logAsExpense` is true, inserts duplicate record in `expenses` under `Marriage`. |
| `PUT` | `/api/marriage/[id]` | Update Vayvhar gifts | Yes | `200 OK`<br>`{ "name"?: string, "city"?: string, "amount"?: number, "date"?: Date, "logAsExpense"?: boolean }` | `200 OK`<br>`{ "record": MarriageRecord }` | Updates record. **Side Effect**: Synchronizes or drops linked associated item in `expenses` based on values. |
| `DELETE` | `/api/marriage/[id]` | Delete a Vayvhar cash gift | Yes | None | `200 OK`<br>`{ "success": true }` | Drops ledger item. **Side Effect**: Deletes any linked record in `expenses` matching `associatedId`. |
| `GET` | `/api/settings` | Read current space configurations | Yes | None | `200 OK`<br>`{ "settings": Settings }` | Returns settings matching `space_id`. Generates defaults if missing. |
| `PATCH` | `/api/settings` | Edit configurations | Yes | `200 OK`<br>`{ "largeAmountLimit"?: number, "lastBackupAt"?: string, "backupReminder"?: object }` | `200 OK`<br>`{ "settings": Settings }` | Updates threshold indicators and notifications. |
| `DELETE` | `/api/settings/clear-all` | Reset space data & settings | Yes | None | `200 OK`<br>`{ "success": true, "message": string }` | **Warning**: Deletes **only** expenses matching `space_id` and resets settings. Does not currently clear `hisab` or `marriage_hisab`. |
| `GET` | `/api/export/csv` | Download CSV records | Yes | Query params: `type="hisab" \| "expenses"` | `200 OK`<br>Stream (`text/csv`) | Exports filtered datasets. |
| `GET` | `/api/export/excel` | Download Excel sheets | Yes | Query params: `type="hisab" \| "expenses"` | `200 OK`<br>Stream (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`) | Exports filtered sheets. |
| `GET` | `/api/export/pdf` | Download PDF document | Yes | Query params: `type="hisab" \| "expenses"` | `200 OK`<br>Stream (`application/pdf`) | Exports formatted reports using PDFKit. |
| `GET` | `/api/collaboration` | View space shared members | Yes | None | `200 OK`<br>`{ "collaborators": User[], "sentRequests": CollaborationRequest[], "receivedRequests": CollaborationRequest[], "currentUserId": string, "currentSpaceId": string }` | Displays lists of space users and active requests. |
| `POST` | `/api/collaboration` | Invite a user to collaborate | Yes | `200 OK`<br>`{ "email": string }` | `200 OK`<br>`{ "success": true, "message": string }` | User must exist (email signed in once). Creates pending invite. |
| `DELETE` | `/api/collaboration` | Remove member or leave space | Yes | `200 OK`<br>`{ "targetUserId": string }` | `200 OK`<br>`{ "success": true, "message": string }` | If target is user themselves, they leave. If owner deletes, target is reset to their own space. |
| `POST` | `/api/collaboration/requests/[id]` | Accept/Reject space invitation | Yes | `200 OK`<br>`{ "action": "accept" \| "reject" }` | `200 OK`<br>`{ "success": true, "message": string }` | If accepted, updates invitee's `space_id` to owner's `space_id`. |
