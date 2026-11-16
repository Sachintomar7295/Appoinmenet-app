# Assessment notes

## 0–10 minutes: clarify and plan
Suggested plan to say aloud:
"I'll first confirm the appointment fields and allowed statuses. I'll build the React list and form, then connect the Express API and MongoDB. I'll test add, status update, filters, search and refresh persistence. If MongoDB setup blocks me, I'll report it early and explain the fallback."

## Change request around minute 50
Ask:
"Should the customer-name search match partial names and ignore uppercase/lowercase differences? Should it search all statuses or only the currently selected status?"

Suggested response:
"I'll add a case-insensitive partial-name search. It will work together with the selected status filter. This is a small frontend change and should fit the remaining time."

## Final demo sequence
1. Add a new appointment.
2. Change its status.
3. Select a status filter.
4. Search by customer name.
5. Refresh and show data still exists in MongoDB.

## Be ready to explain
- `useState`: holds form, filter, search and appointment state.
- `useEffect`: loads appointments when the page opens.
- Express routes: expose CRUD-style API endpoints.
- Mongoose model: defines and validates appointment documents.
- PATCH: updates only the appointment status.
- MongoDB: persists appointments after refresh.

## Honest handover
State which features you tested, any issue that remains, and whether MongoDB was connected during the demo. Disclose AI assistance and any starter code.
