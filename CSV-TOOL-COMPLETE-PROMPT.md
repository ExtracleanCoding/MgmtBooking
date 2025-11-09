# Complete Prompt to Recreate CSV Tool with Charts

## Overview
Create a professional, single-file HTML application for CSV data viewing, editing, filtering, and visualization. The application must be 100% client-side using only HTML, CSS, and vanilla JavaScript (no frameworks). Use Chart.js library for charting capabilities with zoom/pan functionality.

---

## 1. FILE UPLOAD & PARSING SYSTEM

### Requirements:
1. **File Input Methods:**
   - Manual file selection button with custom styling
   - Drag-and-drop support for entire page
   - Visual feedback on drag-over (scale effect, color change)

2. **Encoding Support:**
   - Provide dropdown selector with 7 encoding options:
     - UTF-8 (default)
     - Big5 (繁體中文)
     - GBK (简体中文)
     - Shift-JIS (日本語)
     - EUC-KR (한국어)
     - ISO-8859-1
     - Windows-1252
   - Use FileReader API with encoding parameter

3. **Delimiter Detection:**
   - Auto-detect mode: analyze first line and count occurrences of comma, semicolon, colon, tab, pipe
   - Manual selection dropdown with 5 options
   - Handle escaped delimiters inside quoted fields

4. **Smart Header Detection (7 modes):**
   - **Auto Detect:** Intelligent detection with priority order:
     - First, scan first 200 rows to find "Timestamp" in Column A (case-insensitive)
     - If found, use that row as header and show "(Auto-detected header at row N)"
     - If not found, analyze first row:
       - Check for UUID patterns (8-4-4-4-12 hex format)
       - Check for hash patterns (32+ hex characters)
       - Compare text vs numeric ratio (more text = likely header)
   - **Find Timestamp:** Specifically search for "Timestamp" in Column A:
     - Scan all rows until "Timestamp" is found in first column
     - Use that row as header row
     - Display "(Header found at row N)" message
     - Throw error if not found: "Could not find 'Timestamp' in Column A"
     - Ideal for log files with metadata/comments before actual data
   - **No Header:** Generate column names "Column 1", "Column 2", etc.
   - **First Row:** Use first row as headers
   - **Second Row:** Use second row as headers
   - **After Comments:** Skip comment lines then use next row

5. **Comment Filtering:**
   - Option to filter lines starting with: `#`, `//`, `;`, `--`
   - Apply before parsing data rows

6. **CSV Parsing Logic:**
   - Handle quoted fields with embedded delimiters
   - Handle escaped quotes ("" inside quoted fields)
   - Trim whitespace from unquoted fields
   - Preserve empty cells

7. **File Information Display:**
   - Show filename, file size (in KB)
   - Show row count and column count after parsing
   - Display loading indicator during file read
   - Show error messages for failed parsing

---

## 2. DATA TABLE DISPLAY

### Requirements:
1. **Table Structure:**
   - Sticky header row that stays visible during scroll
   - Responsive table container with max-height and scrollbars
   - Zebra striping on row hover
   - Cell text truncation with ellipsis for long content

2. **Header Styling:**
   - Purple gradient background (`linear-gradient(135deg, #667eea 0%, #764ba2 100%)`)
   - White text with bold font
   - Each header cell contains:
     - Column name (left-aligned, truncated)
     - Sort button with icon (⇅ default, ▲ ascending, ▼ descending)
     - Statistics button (📊 icon)
     - Multi-level sort indicator (▲¹, ▼², etc.)
   - Orange gradient for filtered columns
   - Drag handle for column reordering
   - Resize handle on right edge

3. **Display Limit Control:**
   - Dropdown in info bar with options: 1,000 / 3,000 / 5,000 / 10,000 / 20,000 / 50,000 / 100,000 / Unlimited
   - Default: 10,000 rows
   - Show "Displaying X of Y rows" in info bar

4. **Info Bar:**
   - Display current filter status: "Showing [visible] of [total] rows | [N] visible columns"
   - Position above controls section

---

## 3. SEARCH FUNCTIONALITY

### Requirements:
1. **Search Input:**
   - Text input with placeholder "🔍 Search (press Enter)"
   - Search button next to input
   - Trigger search on Enter key or button click

2. **Search Behavior:**
   - Case-insensitive full-text search across all visible columns
   - Highlight matching text with yellow background (`<span class="highlight">`)
   - Use regex for matching with special character escaping
   - Store search keyword globally and apply on re-render

---

## 4. COLUMN MANAGEMENT

### Requirements:
1. **Show/Hide Columns Modal:**
   - Grid layout of checkboxes (3-4 columns)
   - Each checkbox shows column name
   - Store hidden columns in Set
   - Update table immediately when toggled

2. **Drag-to-Reorder:**
   - Make header cells draggable (HTML5 drag API)
   - Visual feedback during drag (opacity: 0.5)
   - Maintain column order array
   - Preserve all settings (filters, sorts, widths) during reorder

3. **Column Width Modes:**
   - **Average Width:** Calculate container width / number of visible columns
   - **Best-Fit Width:** Analyze first 100 rows, find max text length, calculate width (max_length * 8, clamped to 100-400px)
   - **Fixed Width:** Set all columns to 200px

4. **Manual Resize:**
   - Add resize handle (5px wide, right edge of header)
   - On mousedown: capture start X and current width
   - On mousemove: calculate difference and update width
   - On mouseup: stop resizing
   - Minimum width: 50px

---

## 5. FILTERING SYSTEM

### Requirements:
1. **Filter Modal:**
   - Display list of active filters (grid layout)
   - Each filter row contains:
     - Column dropdown (all column names)
     - Operator dropdown (7 operators)
     - Value input field
     - Delete button (✕)
   - "Add Filter" button to create new filter
   - "Clear All" button to remove all filters
   - "Apply Filters" button to close modal and re-render

2. **Filter Operators:**
   - **Contains:** Case-insensitive substring match
   - **Equals:** Exact case-insensitive match
   - **Not Equals:** Inverse of equals
   - **Starts With:** Prefix match
   - **Ends With:** Suffix match
   - **Greater Than:** Numeric comparison
   - **Less Than:** Numeric comparison

3. **Filter Application:**
   - Apply all filters to csvData using Array.filter()
   - Store results in filteredData array
   - Update info bar with filtered count

4. **Visual Indicators:**
   - Change header background to orange gradient for filtered columns
   - Use class `filtered` on header cells

---

## 6. SORTING SYSTEM

### Requirements:
1. **Multi-Level Sorting:**
   - Click header sort button to add/toggle sort
   - Sort states: Ascending → Descending → Remove
   - Maintain array of sort levels: `[{column: 0, ascending: true}, ...]`
   - Show level number for 2nd+ sorts (▲¹ ▼²)

2. **Sort Logic:**
   - Check if column is numeric (use parseFloat)
   - If both values numeric: compare as numbers
   - Otherwise: use localeCompare for text
   - Apply sorts in order (first sort = primary, second = tiebreaker)

3. **Visual Indicators:**
   - Update sort icon in header button
   - Show sort direction (▲ ascending, ▼ descending, ⇅ none)

---

## 7. CELL EDITING

### Requirements:
1. **Double-Click to Edit:**
   - Add `editable` class to all data cells
   - On double-click: replace cell content with input field
   - Pre-fill input with current value
   - Auto-focus and select text

2. **Save Methods:**
   - Blur event: save value and re-render
   - Enter key: blur input (triggers save)
   - Escape key: cancel edit and re-render

3. **Data Update:**
   - Update csvData array directly at [rowIndex][colIndex]
   - Re-apply filters to update filteredData
   - Re-render entire table

---

## 8. ROW OPERATIONS

### Requirements:
1. **Delete Row:**
   - Add "Delete" button in action column (last column)
   - On click: show confirmation modal
   - Store row index in global variable

2. **Confirmation Modal:**
   - Simple dialog: "Are you sure you want to delete this row?"
   - Cancel button: close modal
   - Delete button: splice row from csvData, re-filter, re-render

---

## 9. STATISTICS SYSTEM

### Requirements:
1. **Column Statistics Modal:**
   - Display grid of stat cards (3-4 columns responsive)
   - Each card shows:
     - Column name as header
     - **Total:** Count of non-empty cells
     - **Unique:** Count of distinct values
     - **Empty:** Count of empty cells
     - For numeric columns:
       - **Min:** Minimum value (2 decimals)
       - **Max:** Maximum value (2 decimals)
       - **Avg:** Average value (2 decimals)

2. **Column Ranking Modal:**
   - Triggered by clicking 📊 button in header
   - Show dropdown to select: Top 10 / 15 / 30 / 50
   - Calculate value frequency distribution
   - Display sorted list with:
     - Rank number (#1, #2, etc.)
     - Value (show "(empty)" for empty strings)
     - Count and percentage
   - Gold/silver/bronze border for top 3

---

## 10. CHART VISUALIZATION SYSTEM

### Requirements:
1. **Chart Modal (XLarge):**
   - Three-column grid layout for options
   - Large canvas area (400px height) below options
   - Live preview that updates on any option change

2. **Data Selection Panel:**
   - **Labels (X-axis):** Dropdown to select one column
   - **Data Columns (Y-axis):** Checkboxes for multi-select
   - **Data Limit:** Dropdown with options: 10 / 20 / 50 / 100 / All rows
   - Use first N rows from filteredData

3. **Chart Types (8 types with icons):**
   - 📊 Bar Chart
   - 📈 Line Chart
   - 🥧 Pie Chart
   - 🍩 Doughnut Chart
   - 📍 Scatter Plot
   - 📉 Area Chart (line with fill)
   - 🎯 Radar Chart
   - ⭕ Polar Area Chart

   Use button grid with active state highlighting

4. **Customization Panel:**
   - **Chart Title:** Text input (default: "Data Visualization")
   - **Color Scheme:** Dropdown with 6 schemes:
     - Default (Purple)
     - Blue Tones
     - Green Tones
     - Red Tones
     - Rainbow
     - Pastel
   - **Show Legend:** Checkbox (default: checked)
   - **Show Grid:** Checkbox (default: checked)

5. **Chart.js Configuration:**
   - Use Chart.js v4.4.1 from CDN
   - Destroy previous chart before creating new one
   - Configure options:
     - `responsive: true`
     - `maintainAspectRatio: false`
     - Title plugin with font size 18px
     - Legend position: top
     - For cartesian charts: Y-axis starts at zero

6. **Zoom & Pan Features:**
   - Include chartjs-plugin-zoom v2.0.1 and Hammer.js v2.0.8
   - Configure zoom options:
     - **Drag-to-Zoom:** Enabled with purple selection box (rgba(102, 126, 234, 0.2))
     - **Wheel Zoom:** Enabled with 10% speed
     - **Pan:** Enabled with Shift modifier key
     - **Mode:** 'xy' for both axes
     - **Limits:** Set to 'original' to prevent zooming beyond data range
   - Add "Reset Zoom" button that calls `chart.resetZoom()`
   - Display zoom instructions panel with controls explanation

7. **Chart Export:**
   - "Download Chart" button
   - Use canvas.toDataURL('image/png')
   - Create temporary anchor element to trigger download
   - Filename: "chart.png"

---

## 11. EXPORT FUNCTIONALITY

### Requirements:
1. **Export Formats (4 types):**
   - **CSV:** Escape values with commas/quotes, use "" for embedded quotes
   - **JSON:** Array of objects with column names as keys
   - **TSV:** Tab-separated values
   - **TXT:** Pipe-separated with header underline

2. **Export Logic:**
   - Use only visible columns (respect hidden columns)
   - Use only filtered data (respect active filters)
   - Maintain column order

3. **Download Implementation:**
   - Create Blob with appropriate MIME type
   - Generate object URL
   - Create anchor element with download attribute
   - Trigger click and cleanup

4. **Copy to Clipboard:**
   - Use Clipboard API (navigator.clipboard.writeText)
   - Copy as CSV format
   - Show success/failure alert

---

## 12. UI/UX DESIGN

### Requirements:
1. **Color Scheme:**
   - Primary gradient: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
   - Background: Same gradient for body
   - Container: White with rounded corners (12px) and shadow
   - Buttons: Purple gradient for primary actions
   - Success: #28a745 (green)
   - Danger: #dc3545 (red)
   - Warning: #fd7e14 (orange)
   - Info: #17a2b8 (cyan)
   - Secondary: #6c757d (gray)
   - Chart: `linear-gradient(135deg, #f093fb 0%, #f5576c 100%)` (pink-red)

2. **Typography:**
   - Font family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif
   - Header title: 2.2em, bold
   - Button text: 0.9em, semi-bold (600)
   - Table text: 0.95em

3. **Button Styling:**
   - Rounded corners: 6px
   - Padding: 8px 16px
   - Hover effect: translateY(-2px) + shadow
   - Icons with gap: 6px between icon and text
   - Small variant: 4px 10px padding, 0.85em font

4. **Modal System:**
   - Full-screen overlay: rgba(0, 0, 0, 0.7)
   - Center modal with max-width: 700px (default), 1000px (large), 1200px (xlarge)
   - Slide-in animation from top (-50px)
   - Close button (×) in top-right
   - Click backdrop to close

5. **Fullscreen Mode:**
   - Toggle button that adds `fullscreen` class to container
   - Fullscreen CSS: fixed position, full viewport, no border-radius
   - Increase table max-height to fit screen

6. **Responsive Design:**
   - Breakpoint at 768px
   - Mobile: Stack controls vertically, full-width buttons
   - Mobile: Single column for chart options and filter rows

---

## 13. GLOBAL STATE MANAGEMENT

### Variables to Track:
```javascript
let csvData = [];              // Original parsed data (2D array)
let filteredData = [];         // Data after applying filters
let headers = [];              // Column names
let hiddenColumns = new Set(); // Set of hidden column indices
let columnFilters = [];        // [{column, operator, value}, ...]
let sortLevels = [];           // [{column, ascending}, ...]
let rowToDelete = -1;          // Index of row pending deletion
let currentRankingColumn = -1; // Column index for ranking modal
let searchKeyword = '';        // Current search term
let columnOrder = [];          // [0, 1, 2, ...] - order of columns
let columnWidths = {};         // {colIndex: width}
let currentFile = null;        // File object
let rawFileContent = '';       // Raw file text for re-parsing
let currentChart = null;       // Chart.js instance
let currentChartType = 'bar';  // Selected chart type
let selectedDataColumns = new Set(); // Set of selected column indices for chart
```

---

## 14. UTILITY FUNCTIONS

Implement these helper functions:

1. **escapeHtml(text):** Convert text to HTML-safe string (use textContent trick)
2. **escapeRegex(str):** Escape special regex characters
3. **escapeCSVValue(value):** Wrap in quotes if contains comma/quote/newline
4. **detectDelimiter(line):** Count occurrences of each delimiter
5. **detectHeader(row):** Check for UUID/hash patterns and text/number ratio
6. **parseLine(line, delimiter):** Handle quoted fields and escape sequences
7. **downloadFile(content, filename, mimeType):** Create Blob and trigger download

---

## 15. EXTERNAL LIBRARIES (CDN)

Include these in `<head>`:
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/hammerjs@2.0.8/hammer.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@2.0.1/dist/chartjs-plugin-zoom.min.js"></script>
```

---

## 16. KEY INTERACTIONS & EVENT HANDLING

1. **File Upload:**
   - Change event on file input → handleFileSelect()
   - Dragover/dragleave/drop events → visual feedback + handleFile()
   - Encoding/delimiter/header mode change → re-parse with parseAndLoadData()

2. **Table Interactions:**
   - Header click on sort button → toggleSort()
   - Header click on stats button → showColumnRanking()
   - Header drag events → dragStart/dragOver/drop for reordering
   - Resize handle mousedown → startResize() + mousemove/mouseup listeners
   - Cell double-click → editCell()
   - Delete button click → deleteRow()

3. **Modal Management:**
   - Open functions: add 'active' class to modal
   - Close functions: remove 'active' class
   - Click on backdrop → close modal

4. **Chart Updates:**
   - Any option change → updateChartPreview()
   - Chart type button click → selectChartType()
   - Data column checkbox → toggleDataColumn()

---

## 17. PERFORMANCE CONSIDERATIONS

1. **Display Limiting:** Only render first N rows (default 10,000)
2. **Chart Data Limiting:** Default to 50 rows for chart preview
3. **Best-Fit Width:** Only analyze first 100 rows
4. **Debouncing:** Not required for current implementation
5. **Chart Cleanup:** Always destroy previous chart before creating new one

---

## 18. BROWSER COMPATIBILITY

- Use FileReader API for file reading
- Use Clipboard API for copy (with try/catch)
- Use HTML5 drag-and-drop API
- Support modern browsers (Chrome, Firefox, Safari, Edge)
- No IE11 support required

---

## 19. ERROR HANDLING

1. File read errors → Display red error message in file info
2. Empty files → Show error "File is empty after filtering"
3. Chart errors → Alert "Please create a chart first!"
4. Clipboard errors → Alert "Failed to copy to clipboard"
5. All errors should be user-friendly with actionable messages

---

## 20. FINAL TOUCHES

1. **Header Section:**
   - Title: "📊 CSV Tool Complete - Professional Editor & Charts"
   - Subtitle: "Upload, analyze, edit, filter, and visualize your data with advanced features"

2. **Upload Section:**
   - Dashed border (2px, purple)
   - Hover effect (lighter background, scale 1.01)
   - File info div below options (hidden by default)

3. **Controls Bar:**
   - Gray background (#f8f9fa)
   - Rounded corners (8px)
   - Flex layout with wrap and gap
   - Search box takes remaining space (flex: 1)

4. **Icons in Buttons:**
   - Use emoji icons for visual appeal
   - Examples: 📈 📊 🔽 👁️ 💾 📄 📋 📝 🔍 ⛶

5. **Multilingual Labels:**
   - Include both Chinese and English labels where specified
   - Examples: "分隔符號 Delimiter", "標題模式 Header Mode"

---

## IMPLEMENTATION CHECKLIST

□ File upload with drag-and-drop
□ 7 encoding support
□ 5 delimiter options with auto-detect
□ 7 header detection modes (including "Find Timestamp")
□ Smart "Timestamp" detection in Column A for log files
□ Comment filtering
□ Smart CSV parsing with quote handling
□ Sticky table headers
□ Display limit control (8 options)
□ Full-text search with highlighting
□ Multi-column filtering (7 operators)
□ Orange highlighting for filtered columns
□ Show/Hide columns modal
□ Drag-to-reorder columns
□ Column width modes (3 options)
□ Manual column resizing
□ Multi-level sorting
□ Double-click cell editing
□ Delete row with confirmation
□ Column statistics (6 metrics)
□ Column ranking (Top 10/15/30/50)
□ 8 chart types
□ Multi-column chart data selection
□ 6 color schemes
□ Chart zoom (drag, wheel, pan)
□ Reset zoom functionality
□ Download chart as PNG
□ Export to CSV/JSON/TSV/TXT
□ Copy to clipboard
□ Fullscreen mode
□ Modal system (6 modals)
□ Responsive design
□ Error handling
□ All visual styles and animations

---

## ESTIMATED FILE SIZE

- Total lines: ~2,020 lines
- HTML structure: ~220 lines
- CSS styles: ~670 lines
- JavaScript logic: ~1,130 lines
- All in single HTML file

## RECENT ENHANCEMENTS

**Timestamp Header Detection (2025-11-09):**
- Added "⏱️ Find Timestamp" mode to handle log files with metadata before actual data
- Enhanced "Auto Detect" to prioritize finding "Timestamp" in Column A
- Scans up to first 200 rows for auto-detect, all rows for explicit mode
- Shows visual feedback: "(Header found at row N)" or "(Auto-detected header at row N)"
- Perfect for capacity logs and system request logs with variable metadata lengths
