# Rich Text Formatting Guide - SecureNotes

## Understanding the Markdown Formatting System

The secret to SecureNotes' formatting system is that it works like **professional note-taking apps** (Notion, Obsidian, Apple Notes). You write in **markdown**·syntax, not WYSIWYG.

## How It Works

### Step 1: Enter Edit Mode
```
In NoteEditorScreen:
- Tap pencil icon (top right) → Edit Mode
- Tap eye icon (top right) → Preview Mode
```

### Step 2: Type Your Note
In **EDIT MODE**, you type plaintext with markdown syntax:
```
My Shopping List
- apple
- banana
- milk

This is **bold text**
This is *italic text*
This is ~~deleted text~~
This is __underlined__
Check [my website](example.com)
```

### Step 3: Toggle Preview
Click **EYE ICON** to switch to **PREVIEW MODE**

### Step 4: See Formatted Output
In **PREVIEW MODE**, markdown is rendered:
- **bold text** appears in bold
- *italic text* appears in italics  
- ~~deleted text~~ appears crossed out
- __underlined__ appears with underline
- [link text](url) appears as clickable blue link with underline

## Markdown Syntax Reference

### Bold Text
```markdown
**bold text**  or  __bold text__
```
Result: **bold text**

### Italic Text
```markdown
*italic text*
```
Result: *italic text*

### Strikethrough
```markdown
~~deleted text~~
```
Result: ~~deleted text~~

### Underline
```markdown
__underlined text__
```
Result: <u>underlined text</u>

### Links
```markdown
[click here](https://example.com)
```
Result: Click here (displayed as blue underlined link)

### Lists
```markdown
- Item 1
- Item 2
- Item 3

or

1. First
2. Second
3. Third
```
Result:
- Item 1
- Item 2
- Item 3

### Headings
```markdown
# Heading 1
## Heading 2
### Heading 3
```

## How Our Formatting Buttons Work

When you tap formatting buttons:

### Using Toolbar Buttons

1. **Tap Button** (B, I, U, S, ∞, etc.)
2. **Cursor moves INSIDE the markers** (not after them)
3. **Start typing** - your text appears inside the markers
4. **Text gets styled**

### Example: Making Text Bold

**Before:**
```
Type some text here and I want this to be bold|
```
(| = cursor)

**Step 1: Select text**
```
Type some text here and I want |this to be bold|
```

**Step 2: Tap Bold button**
```
Type some text here and I want **|this to be bold**|
```
(Cursor inside markers)

**Step 3: Release and see preview**
Toggle preview mode → **this to be bold** (rendered!)

---

## If Formatting Still Looks Wrong

### Symptom 1: I See Asterisks (**) in Preview
**Cause**: Invalid markdown syntax

**Solution**: Check spacing and syntax:
```
❌ * italic*        → needs * on both sides
❌ **bold *         → needs closing **
✅ *italic*         → correct
✅ **bold**         → correct
```

### Symptom 2: Links Don't Click
**Cause**: URL format issues

**Solution**: Make sure URL starts with http:// or https://
```
❌ [link](google.com)        → missing https://
✅ [link](https://google.com) → correct
✅ [link](google.com)         → auto-adds https:// now!
```

### Symptom 3: Formatting Buttons Not Responding
**Cause**: UI freeze or state issue

**Solution**: 
1. Pull latest code (commit fc464cf)
2. Restart app: `npx expo start --host lan --port 8081 --clear`
3. Try again

### Symptom 4: Mixed Formatting Not Working
**Example**: Bold + Italic text `***text***`

**Current Limitation**: Nested formatting not fully supported

**Workaround**: Use separate lines:
```
**bold text**
*italic text*
```

## Technical Implementation

### Frontend (React Native)
**File**: `src/screens/notes/NoteEditorScreen.tsx`

```typescript
const applyFormat = (prefix: string, suffix: string = prefix) => {
  // When user taps Bold/Italic/etc button:
  
  // 1. Get selected text (or empty if nothing selected)
  const selectedText = body.substring(selection.start, selection.end);
  
  // 2. Build formatted result
  const newText = 
    body.substring(0, selection.start) +
    prefix +
    selectedText +
    suffix +
    body.substring(selection.end);
  
  setBody(newText);
  
  // 3. Position cursor:
  if (selectedText.length === 0) {
    // No text selected → cursor goes INSIDE markers
    const cursorInside = selection.start + prefix.length;
    setSelection({ start: cursorInside, end: cursorInside });
  } else {
    // Text was selected → cursor after closing marker
    const newCursorPos = selection.start + prefix.length + selectedText.length + suffix.length;
    setSelection({ start: newCursorPos, end: newCursorPos });
  }
};
```

### Preview Component
**File**: `src/components/notes/RichTextPreview.tsx`

```typescript
// Markdown token regex pattern
const TOKEN_REGEX = /(\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|\*[^*]+\*|\[[^\]]+\]\(([^)]+)\))/g;

// Parse and render with StyleSheet
const renderToken = (token: InlineToken) => {
  if (token.style?.fontWeight === '700') return <Text style={styles.bold}>{text}</Text>;
  if (token.style?.fontStyle === 'italic') return <Text style={styles.italic}>{text}</Text>;
  if (token.linkUrl) return <Text style={styles.link} onPress={openLink}>{text}</Text>;
};
```

## Why This Design?

### Advantages
- ✅ **Fast typing** - No performance overhead
- ✅ **Clean preview** - Markdown visible in editor
- ✅ **Professional** - Like Notion, Obsidian
- ✅ **Encrypted well** - Markdown text encrypts cleanly
- ✅ **Portable** - Export as .md file anytime

### Disadvantages (vs WYSIWYG)
- ❌ Requires learning markdown syntax
- ❌ Symbols visible in edit mode
- ❌ Different from MS Word/Pages

## Best Practices for Note Taking

### 1. Keep It Simple
```
✅ Good:
# My Title
- Point 1
- Point 2
**Important**: Remember this

❌ Complex:
# Heading 1
## Heading 2
### Heading 3
Mixed ***bold and italic*** text
```

### 2. Use Lists for Organization
```markdown
Shopping List
- Milk
- Eggs
- Bread

Meeting Notes
1. Review agenda
2. Discuss budget
3. Plan next steps
```

### 3. Use Bold for Emphasis
```markdown
**Important**: This deadline is critical

Normal important text can be **highlighted**
```

### 4. Links for Reference
```markdown
[Read more](https://example.com)
[Contact support](mailto:help@example.com)
```

## Troubleshooting Checklist

- [ ] Latest code pulled? `git pull origin main`
- [ ] App restarted? `npx expo start --host lan --port 8081 --clear`
- [ ] Markdown syntax correct? (matching pairs of symbols)
- [ ] Switched to preview mode? (eye icon)
- [ ] Text not too long? (test with short note first)
- [ ] Tried different formatting? (test bold, then italic)

## Still Having Issues?

Check these files in your app:

1. **Editor Component**
   - File: `src/screens/notes/NoteEditorScreen.tsx`
   - Lines 150-200: Check `applyFormat()` function
   - Lines 250-300: Check toolbar button handlers

2. **Preview Component**
   - File: `src/components/notes/RichTextPreview.tsx`
   - Lines 10-15: Check TOKEN_REGEX pattern
   - Lines 30-80: Check token parsing logic
   - Lines 100-150: Check text rendering in JSX

3. **Styles**
   - File: `src/components/notes/RichTextPreview.tsx` (bottom)
   - Make sure fonts aren't overridden by parent styles

## Expected Behavior After Latest Fix

1. ✅ You can **select text** and tap formatting buttons
2. ✅ **Marker symbols appear** around your text `**your text**`
3. ✅ **Cursor positioned inside** markers (not after)
4. ✅ You can continue typing your formatted text
5. ✅ Toggle to **preview mode** to see formatting
6. ✅ **All styles render**: bold, italic, underline, strikethrough, links
7. ✅ **Links are clickable** and open in browser
8. ✅ **Multiple lines work**: Press Enter to create new lines with formatting

---

## Platform-Specific Notes

### iOS (iPhone 16)
- ✅ Face ID works (implemented in biometricService)
- ✅ Rich text rendering smooth
- ✅ Markdown preview works

### Android
- ✅ Fingerprint works (implemented in biometricService)
- ✅ Rich text rendering smooth  
- ✅ Markdown preview works

## Future Improvements

Possible enhancements to formatting:
1. **Code blocks** - ` ```code``` `
2. **Tables** - Markdown table syntax
3. **Emoji support** - 😊 rendering
4. **Nested lists** - Indented bullets
5. **Inline code** - `` `code` `` syntax
6. **Block quotes** - `> quote` syntax

---

For more help or to report issues:
📧 Email: danielamoakokodua698@gmail.com
🐙 GitHub: https://github.com/officialjwise/safe_note
