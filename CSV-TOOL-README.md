# 🗂️ CSV Tool - Data Viewer & Editor

A complete, standalone CSV file viewer and editor built with pure HTML, CSS, and JavaScript. No dependencies, no frameworks, no backend required.

## ✨ Features

### 📥 File Import
- **Drag & Drop** or click to upload CSV files
- **Multiple Encoding Support**: UTF-8, ISO-8859-1, Windows-1252, UTF-16
- **Real-time File Info**: Shows filename, size, row count, and column count
- **Automatic Parsing**: Handles quoted fields, commas in values, and escape characters

### 📊 Data Viewing
- **Sortable Columns**: Click any column header to sort (ascending/descending)
- **Search/Filter**: Real-time search across all data
- **Responsive Table**: Automatically adjusts to screen size
- **Visual Indicators**: Sort direction arrows on headers

### 🎛️ Data Manipulation
- **Hide/Show Columns**: Toggle visibility of specific columns
- **Delete Rows**: Remove rows with confirmation dialog
- **Column Statistics**: View statistics for each column including:
  - Total values
  - Unique values
  - Empty cells
  - Min/Max/Average (for numeric columns)

### 💾 Export Options
- **CSV Export**: Download filtered/modified data as CSV
- **JSON Export**: Convert to JSON format
- **TSV Export**: Tab-separated values format
- **Copy to Clipboard**: Quick copy for pasting into other applications

### 🎨 User Interface
- **Beautiful Gradient Theme**: Purple gradient design
- **Fullscreen Mode**: Maximize viewing area
- **Modal Dialogs**: Clean popups for column management and statistics
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Smooth Animations**: Polished user experience

## 🚀 Quick Start

### Option 1: Open Directly in Browser
1. Simply open `csv-tool.html` in any modern web browser
2. No installation or setup required!

### Option 2: Use with a Local Server
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js http-server
npx http-server

# Then open: http://localhost:8000/csv-tool.html
```

## 📖 How to Use

### 1. Upload Your CSV File
- Click **"Choose CSV File"** or drag and drop a CSV file onto the upload area
- Select the appropriate character encoding if needed (default: UTF-8)
- The file will be automatically parsed and displayed

### 2. Explore Your Data
- **Sort**: Click any column header to sort by that column
- **Search**: Type in the search box to filter rows
- **Scroll**: Navigate through your data in the table

### 3. Manage Columns
- Click **"Show/Hide Columns"** button
- Check/uncheck columns to show or hide them
- Hidden columns are excluded from exports

### 4. View Statistics
- Click **"Column Statistics"** button
- See detailed statistics for each column
- Numeric columns show min, max, and average values

### 5. Delete Rows
- Click **"Delete"** button on any row
- Confirm the deletion in the popup dialog
- Row is permanently removed from the current session

### 6. Export Your Data
- **Export CSV**: Download as comma-separated values
- **Export JSON**: Download as JSON array of objects
- **Export TSV**: Download as tab-separated values
- **Copy to Clipboard**: Quick copy for pasting elsewhere

### 7. Fullscreen Mode
- Click **"Fullscreen"** button to maximize the viewing area
- Click again to return to normal mode

## 🧪 Try It Now

A sample CSV file (`sample-data.csv`) is included with employee data. Use it to test all features:

1. Open `csv-tool.html` in your browser
2. Upload `sample-data.csv`
3. Try sorting by Salary (numeric sorting)
4. Search for "Engineering"
5. Hide the "Phone" column
6. View column statistics
7. Export to JSON

## 🎯 Use Cases

- **Data Analysis**: Quick exploration of CSV files without Excel
- **Data Cleaning**: Filter and remove unwanted rows
- **Format Conversion**: Convert between CSV, JSON, and TSV
- **Data Inspection**: View statistics and unique values
- **Data Sharing**: Copy data to clipboard for sharing
- **Mobile Viewing**: View CSV files on mobile devices

## 🔧 Technical Details

### Browser Compatibility
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

### File Size Limits
- Recommended: Up to 10MB (~100,000 rows)
- Maximum: Limited by browser memory
- All processing happens in-browser (client-side only)

### Data Privacy
- **100% Client-Side**: No data is sent to any server
- **No Tracking**: No analytics or tracking code
- **No Storage**: Data is only in memory (not saved in browser)
- **Secure**: Works offline completely

### CSV Parsing Features
- Handles quoted fields with commas
- Supports escaped quotes ("")
- Handles different line endings (LF, CRLF)
- Trims whitespace from fields
- Supports multiple character encodings

## 🎨 Customization

### Change Color Scheme
Edit the CSS gradient in the `<style>` section:
```css
/* Current: Purple gradient */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Example: Blue gradient */
background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
```

### Add Custom Export Formats
Extend the `exportData()` function to add new formats:
```javascript
else if (format === 'xml') {
    content = generateXML();
    mimeType = 'text/xml';
    filename = 'export.xml';
}
```

## 📋 Features Comparison

| Feature | CSV Tool | Excel | Google Sheets |
|---------|----------|-------|---------------|
| No Installation | ✅ | ❌ | ✅ |
| Offline Use | ✅ | ✅ | ❌ |
| Free | ✅ | ❌ | ✅ |
| Fast Loading | ✅ | ⚠️ | ⚠️ |
| Privacy | ✅ | ✅ | ⚠️ |
| Mobile Friendly | ✅ | ❌ | ✅ |

## 🐛 Known Limitations

- No editing of individual cells (only row deletion)
- No formulas or calculations
- No charts or visualizations
- No multi-file merge
- Large files (>50MB) may be slow

## 🔮 Future Enhancements

Potential features for future versions:
- [ ] Cell editing capabilities
- [ ] Add new rows
- [ ] Column reordering (drag & drop)
- [ ] Advanced filtering (multiple conditions)
- [ ] Data validation
- [ ] Duplicate detection
- [ ] Excel file support (.xlsx)
- [ ] Chart generation
- [ ] Find & replace
- [ ] Undo/redo functionality

## 📄 License

This is a standalone tool created for educational purposes. Feel free to use, modify, and distribute.

## 🙋 Support

This tool is self-contained in a single HTML file. All functionality is documented in this README.

For questions or issues:
1. Check the browser console for errors (F12)
2. Try a different browser
3. Verify CSV file format is valid

## 🎓 Learning Resources

This tool demonstrates:
- File API for reading files
- Drag & Drop API
- CSV parsing algorithms
- DOM manipulation
- Modern CSS (Grid, Flexbox)
- Modal dialogs
- Data export techniques
- Client-side data processing

## 🌟 Credits

Inspired by https://it.jason.tools/?tool=csv

Built with:
- Pure HTML5
- Vanilla JavaScript (ES6+)
- Modern CSS3
- No external dependencies

---

**Made with ❤️ for data enthusiasts**
