# 📊 Chart Zoom & Pan Features - Quick Guide

## 🔍 Interactive Zoom Capabilities

Your CSV Tool now has **professional-grade zoom and pan functionality** for all charts, just like advanced data visualization tools!

---

## ✨ Features Added

### 1. **Drag-to-Zoom** (Box Selection)
- **How**: Click and drag on the chart to draw a selection box
- **What**: The chart will zoom into the selected area
- **Visual Feedback**: Purple semi-transparent box shows your selection
- **Best For**: Focusing on specific data ranges

### 2. **Mouse Wheel Zoom**
- **How**: Scroll mouse wheel up/down while hovering over chart
- **What**: Zoom in (scroll up) or zoom out (scroll down)
- **Speed**: Smooth, controlled zooming at 10% increments
- **Best For**: Quick exploration of data

### 3. **Pan (Navigate While Zoomed)**
- **How**: Hold **Shift** key and drag on the chart
- **What**: Move around the zoomed view without changing zoom level
- **Best For**: Exploring different parts of your zoomed data

### 4. **Reset Zoom**
- **How**: Click the **"🔍 Reset Zoom"** button
- **What**: Instantly restore the chart to full data range
- **Shortcut**: Double-click on chart also resets (Chart.js feature)

---

## 🎯 How to Use

### Basic Workflow:

1. **Create a Chart**
   - Select data columns
   - Choose chart type
   - Click "Update Preview"

2. **Zoom In on Interesting Area**
   - **Method A**: Click and drag to select area (box zoom)
   - **Method B**: Scroll wheel to zoom in/out
   - **Method C**: Use both for fine control!

3. **Navigate the Zoomed View**
   - Hold **Shift** and drag to pan
   - Scroll to zoom further

4. **Reset to Full View**
   - Click **"🔍 Reset Zoom"** button
   - Or double-click the chart

---

## 📋 Practical Examples

### Example 1: Finding Outliers in Salary Data
```
Scenario: You have 100 employees and want to focus on high earners

1. Create bar chart: Department vs Salary
2. Drag-select the top 20% of bars
3. Chart zooms to show only those salaries
4. Pan with Shift+drag to see adjacent data
5. Reset zoom to see full picture again
```

### Example 2: Analyzing Time Series Trends
```
Scenario: You have monthly sales data for 5 years, want to see Q4 detail

1. Create line chart: Month vs Revenue
2. Scroll wheel to zoom in on general area
3. Drag-select the October-December period
4. Now you see daily granularity for Q4
5. Pan with Shift+drag through different years' Q4
6. Reset to see full 5-year trend
```

### Example 3: Comparing Specific Data Points
```
Scenario: Scatter plot of Age vs Salary, focus on 30-40 age range

1. Create scatter plot: Age vs Salary
2. Drag-select rectangle covering ages 30-40
3. Chart zooms to show only that age range
4. Scroll to zoom closer on interesting clusters
5. Pan to see adjacent age ranges
6. Reset when done
```

---

## 🎨 Visual Feedback

When you drag to zoom, you'll see:
- **Selection Box**: Purple semi-transparent overlay
- **Border**: Purple border showing selected area
- **Cursor**: Changes to crosshair during selection

After zooming:
- **Pan Cursor**: Changes when holding Shift
- **Zoom Level**: Visible in how data fills the chart

---

## ⚙️ Technical Details

### Zoom Plugin Configuration:
```javascript
zoom: {
    zoom: {
        wheel: { enabled: true, speed: 0.1 },      // Mouse wheel zoom
        drag: { enabled: true },                    // Drag-to-zoom
        mode: 'xy'                                  // Both X and Y axes
    },
    pan: {
        enabled: true,                              // Pan enabled
        mode: 'xy',                                 // Pan on both axes
        modifierKey: 'shift'                        // Hold Shift to pan
    }
}
```

### Supported Chart Types:
- ✅ **Bar Charts**: Zoom into specific categories
- ✅ **Line Charts**: Focus on time ranges
- ✅ **Scatter Plots**: Examine data clusters
- ✅ **Area Charts**: Analyze trend details
- ⚠️ **Pie/Doughnut**: Limited zoom (scale only)
- ⚠️ **Radar**: Limited zoom
- ⚠️ **Polar**: Limited zoom

---

## 💡 Pro Tips

### Tip 1: Combine Zoom Methods
- Start with drag-select for rough area
- Use wheel zoom for fine-tuning
- Pan to explore surrounding data

### Tip 2: Multi-Level Zoom
- You can zoom multiple times
- Each zoom focuses further
- Reset brings you back to original

### Tip 3: Zoom Before Download
- Zoom to interesting area
- Click "Download Chart"
- PNG will show zoomed view!

### Tip 4: Use with Filtering
- Filter data first (e.g., Department = "Engineering")
- Create chart
- Zoom into specific ranges
- See fine-grained filtered data

### Tip 5: Axis-Specific Zoom
- Drag horizontally: Zoom X-axis only
- Drag vertically: Zoom Y-axis only
- Drag diagonally: Zoom both axes

---

## 🐛 Troubleshooting

### Problem: Can't drag to select
**Solution**: Make sure you're clicking directly on the chart canvas, not on axis labels

### Problem: Pan not working
**Solution**: Hold down the **Shift** key while dragging

### Problem: Zoom too sensitive
**Solution**: Use smaller mouse wheel movements or drag smaller selection boxes

### Problem: Lost my data after zooming
**Solution**: Click "🔍 Reset Zoom" button to restore full view

### Problem: Chart won't zoom
**Solution**: Pie/Doughnut/Radar charts have limited zoom. Use Bar/Line/Scatter instead.

---

## 🔄 Keyboard & Mouse Controls Summary

| Action | Method | Description |
|--------|--------|-------------|
| **Drag-to-Zoom** | Click + Drag | Draw box to select area |
| **Scroll Zoom** | Mouse Wheel | Zoom in/out incrementally |
| **Pan** | Shift + Drag | Move around zoomed view |
| **Reset Zoom** | Click Button | Restore full data view |
| **Double-Click** | Double-Click Chart | Alternative reset method |

---

## 📊 Use Cases by Chart Type

### Bar Charts
- **Best For**: Comparing specific categories
- **Zoom Use**: Focus on subset of categories
- **Example**: Zoom into top 10 products

### Line Charts
- **Best For**: Time series analysis
- **Zoom Use**: Examine specific time periods
- **Example**: Focus on last 6 months of yearly data

### Scatter Plots
- **Best For**: Finding correlations
- **Zoom Use**: Examine clusters and outliers
- **Example**: Zoom into high-correlation region

### Area Charts
- **Best For**: Cumulative trends
- **Zoom Use**: Detailed period analysis
- **Example**: Zoom into rapid growth period

---

## 🎓 Advanced Techniques

### Technique 1: Progressive Zoom
1. Start with full chart
2. Identify interesting region
3. Drag-select that region
4. Zoom again within that region
5. Continue until desired granularity
6. Reset to start over

### Technique 2: Comparative Analysis
1. Create chart with multiple data series
2. Zoom into specific X-axis range
3. Compare Y-values at same granularity
4. Pan to see adjacent ranges
5. Take screenshots of each view

### Technique 3: Data Validation
1. Create chart
2. Zoom to suspected anomaly
3. Verify data accuracy at high detail
4. Pan to check surrounding context
5. Reset and look for other anomalies

---

## 🌟 Benefits

### For Data Analysis:
- ✅ **Find Patterns**: Zoom reveals hidden trends
- ✅ **Identify Outliers**: Easier to spot anomalies
- ✅ **Validate Data**: Check accuracy at granular level
- ✅ **Compare Periods**: Focus on specific time ranges

### For Presentations:
- ✅ **Show Details**: Zoom for detailed views
- ✅ **Tell Stories**: Zoom to highlight key findings
- ✅ **Answer Questions**: Quick drill-down during meetings
- ✅ **Export Views**: Download zoomed charts for reports

### For Exploration:
- ✅ **Interactive**: Engage with your data
- ✅ **Flexible**: Multiple zoom methods
- ✅ **Fast**: Instant zoom response
- ✅ **Intuitive**: Natural drag-to-zoom gesture

---

## 📦 Libraries Used

### Chart.js (v4.4.1)
- Core charting library
- CDN: `https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js`

### Hammer.js (v2.0.8)
- Touch gesture library for mobile support
- CDN: `https://cdn.jsdelivr.net/npm/hammerjs@2.0.8/hammer.min.js`

### Chart.js Zoom Plugin (v2.0.1)
- Adds zoom and pan capabilities
- CDN: `https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@2.0.1/dist/chartjs-plugin-zoom.min.js`

---

## 🚀 Quick Start

1. **Open** `csv-tool-with-charts.html`
2. **Upload** your CSV file
3. **Create** a chart (Bar or Line recommended)
4. **Drag** on chart to zoom in
5. **Hold Shift + Drag** to pan
6. **Click Reset** to restore
7. **Experiment** with different zoom levels!

---

## 🎉 Summary

You now have **professional zoom and pan capabilities** in your CSV tool:

✅ **Drag-to-Zoom**: Click and drag to select areas
✅ **Scroll Zoom**: Mouse wheel for quick zoom
✅ **Pan**: Shift+drag to navigate
✅ **Reset**: One-click restore to full view
✅ **Visual Feedback**: See what you're selecting
✅ **Works on Most Charts**: Bar, Line, Scatter, Area
✅ **Export Zoomed Views**: Download what you see
✅ **100% Client-Side**: No server needed

**Perfect for**: Data exploration, anomaly detection, detailed analysis, and presentation preparation!

---

**Powered by Chart.js + chartjs-plugin-zoom**
*Making your data analysis more interactive and insightful!*
