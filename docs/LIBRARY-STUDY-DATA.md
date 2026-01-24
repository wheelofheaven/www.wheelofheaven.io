# Library Study Data Persistence

## Current Implementation

User study data (bookmarks, highlights, notes, reading progress) is stored in the browser's **localStorage**.

### Storage Keys
All keys are prefixed with `woh_library_`:
- `woh_library_preferences` - Reading preferences (font size, theme)
- `woh_library_progress` - Reading progress by book
- `woh_library_bookmarks` - Bookmarked paragraphs
- `woh_library_highlights` - Text highlights
- `woh_library_notes` - User notes
- `woh_library_history` - Recently read books

### Limitations
- **Device-specific**: Data doesn't sync across devices/browsers
- **Volatile**: Can be lost if browser data is cleared
- **Size limit**: ~5-10MB depending on browser
- **No offline backup**: Relies on user to export

## Export/Import Feature

Users can backup their data via the Study Panel:

1. Click the **Study** button (bookmark icon) in the reader
2. Click **Export** to download `wheel-of-heaven-study-data.json`
3. Click **Import** to restore from a previously exported file

### Export Format
```json
{
  "version": "1.0",
  "exportedAt": "2025-01-24T12:00:00.000Z",
  "preferences": {
    "fontSize": "medium",
    "theme": "light"
  },
  "progress": {
    "the-book-which-tells-the-truth": {
      "lastRead": "2025-01-24T12:00:00.000Z",
      "currentChapter": 3,
      "currentParagraph": "c3p45"
    }
  },
  "bookmarks": {
    "the-book-which-tells-the-truth": [
      {
        "refId": "TBWTT-1:5",
        "chapter": 1,
        "paragraph": 5,
        "note": "Important passage",
        "created": "2025-01-24T10:00:00.000Z"
      }
    ]
  },
  "highlights": {...},
  "notes": {...},
  "history": [...]
}
```

## Future Enhancement Options

### Option 1: IndexedDB Migration
More robust client-side storage with larger limits (~50MB+).

**Pros**: Better performance, larger storage, structured queries
**Cons**: Still device-specific, more complex API

### Option 2: Cloud Sync (Recommended for multi-device)
Backend service for syncing across devices.

**Implementation options**:
- **Supabase** - Open source, PostgreSQL-based, generous free tier
- **Firebase** - Google's BaaS, real-time sync
- **Custom API** - Full control, requires hosting

**Required changes**:
1. Add authentication (OAuth, magic link, or anonymous)
2. Create sync API endpoints
3. Implement conflict resolution
4. Update storage module to sync with backend

**Schema** (see `schemas/study-data.schema.json`):
```sql
-- Supabase example
CREATE TABLE study_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  book_slug TEXT NOT NULL,
  data_type TEXT NOT NULL, -- 'bookmark', 'highlight', 'note'
  ref_id TEXT NOT NULL,
  content JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Option 3: Git-based Storage
Store study data in user's own GitHub repository.

**Pros**: Version controlled, user owns data
**Cons**: Requires GitHub account, complex UX

### Option 4: Browser Sync APIs
Use browser-native sync (Chrome Sync Storage, Firefox Sync).

**Pros**: Automatic sync within same browser ecosystem
**Cons**: Browser-specific, limited to logged-in users

## Recommended Approach

For a static site without backend:

1. **Keep localStorage** as primary storage (simple, works offline)
2. **Improve export UX**:
   - Add "last exported" indicator
   - Remind users to export periodically
   - Auto-download on significant changes
3. **Document backup importance** in UI
4. **Add IndexedDB** for larger storage if needed
5. **Plan cloud sync** as future premium feature

## Implementation Priority

| Priority | Feature | Effort |
|----------|---------|--------|
| ✅ Done | localStorage + export/import | - |
| 🔜 Next | Backup reminders in UI | Low |
| 📋 Future | IndexedDB migration | Medium |
| 📋 Future | Cloud sync (Supabase) | High |

## Code References

- `static/js/library-storage.js` - Storage API
- `static/js/library-study-tools.js` - UI for study tools
- `schemas/study-data.schema.json` - Export format schema
