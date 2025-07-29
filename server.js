const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    secret: 'myproperty-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Data file path
const DATA_FILE = path.join(__dirname, 'data.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
        users: [{
            username: 'myproperty',
            password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' // hashed 'myproperty@123'
        }],
        lands: []
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
}

// Helper functions
const readData = () => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading data file:', error);
        return { users: [], lands: [] };
    }
};

const writeData = (data) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing data file:', error);
        return false;
    }
};

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
};

// Routes

// Serve login page
app.get('/', (req, res) => {
    if (req.session.user) {
        res.redirect('/dashboard');
    } else {
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
    }
});

// Serve dashboard
app.get('/dashboard', (req, res) => {
    if (req.session.user) {
        res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
    } else {
        res.redirect('/');
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    const data = readData();
    const user = data.users.find(u => u.username === username);
    
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.user = { username: user.username };
        res.json({ success: true, message: 'Login successful' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.status(500).json({ success: false, message: 'Error logging out' });
        } else {
            res.json({ success: true, message: 'Logout successful' });
        }
    });
});

// Get all lands with counts by category
app.get('/api/lands', requireAuth, (req, res) => {
    const data = readData();
    const lands = data.lands;
    
    const areaRanges = [
        '0-25 gaj', '25-50 gaj', '50-75 gaj', '75-100 gaj',
        '100-250 gaj', '250-500 gaj', '500-750 gaj', '750-1000 gaj'
    ];
    
    const counts = {};
    areaRanges.forEach(range => {
        counts[range] = lands.filter(land => land.areaRange === range).length;
    });
    
    res.json({ 
        success: true, 
        lands: lands,
        counts: counts 
    });
});

// Get all lands grouped by area ranges
app.get('/api/lands/all', requireAuth, (req, res) => {
    const data = readData();
    const lands = data.lands;
    
    const areaRanges = [
        '0-25 gaj', '25-50 gaj', '50-75 gaj', '75-100 gaj',
        '100-250 gaj', '250-500 gaj', '500-750 gaj', '750-1000 gaj'
    ];
    
    const groupedLands = {};
    areaRanges.forEach(range => {
        groupedLands[range] = lands.filter(land => land.areaRange === range);
    });
    
    res.json({ 
        success: true, 
        groupedLands: groupedLands,
        totalCount: lands.length
    });
});

// Get lands by category
app.get('/api/lands/:category', requireAuth, (req, res) => {
    const { category } = req.params;
    const data = readData();
    const categoryLands = data.lands.filter(land => land.areaRange === category);
    res.json(categoryLands);
});

// Add new land
app.post('/api/lands', requireAuth, (req, res) => {
    const { areaRange, condition, latitude, longitude, name, landmark } = req.body;
    
    if (!areaRange || !condition || !latitude || !longitude || !name || !landmark) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    const data = readData();
    const newLand = {
        id: Date.now().toString(),
        areaRange,
        condition,
        name: name.trim(),
        landmark: landmark.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        mapLink: `https://www.google.com/maps?q=${latitude},${longitude}`,
        createdAt: new Date().toISOString()
    };
    
    data.lands.push(newLand);
    
    if (writeData(data)) {
        res.json({ success: true, message: 'Land added successfully', land: newLand });
    } else {
        res.status(500).json({ success: false, message: 'Error saving land data' });
    }
});

// Update land
app.put('/api/lands/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const { areaRange, condition, latitude, longitude, name, landmark } = req.body;
    
    const data = readData();
    const landIndex = data.lands.findIndex(land => land.id === id);
    
    if (landIndex === -1) {
        return res.status(404).json({ success: false, message: 'Land not found' });
    }
    
    data.lands[landIndex] = {
        ...data.lands[landIndex],
        areaRange,
        condition,
        name: name.trim(),
        landmark: landmark.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        mapLink: `https://www.google.com/maps?q=${latitude},${longitude}`,
        updatedAt: new Date().toISOString()
    };
    
    if (writeData(data)) {
        res.json({ success: true, message: 'Land updated successfully', land: data.lands[landIndex] });
    } else {
        res.status(500).json({ success: false, message: 'Error updating land data' });
    }
});

// Delete land
app.delete('/api/lands/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    
    const data = readData();
    const landIndex = data.lands.findIndex(land => land.id === id);
    
    if (landIndex === -1) {
        return res.status(404).json({ success: false, message: 'Land not found' });
    }
    
    data.lands.splice(landIndex, 1);
    
    if (writeData(data)) {
        res.json({ success: true, message: 'Land deleted successfully' });
    } else {
        res.status(500).json({ success: false, message: 'Error deleting land data' });
    }
});

// Export data as CSV
app.get('/api/export', requireAuth, (req, res) => {
    const data = readData();
    const lands = data.lands;
    
    let csv = 'ID,Name,Landmark,Area Range,Condition,Latitude,Longitude,Map Link,Created At\n';
    lands.forEach(land => {
        csv += `${land.id},"${land.name || ''}","${land.landmark || ''}","${land.areaRange}","${land.condition}",${land.latitude},${land.longitude},"${land.mapLink}","${land.createdAt}"\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="lands_data.csv"');
    res.send(csv);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
