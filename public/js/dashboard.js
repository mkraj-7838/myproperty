// Dashboard functionality
let allLands = [];
let currentCategory = '';
let isEditMode = false;
let editingLandId = null;

document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
    setupEventListeners();
});

function setupEventListeners() {
    // Modal events
    document.getElementById('landForm').addEventListener('submit', handleLandSubmit);
    
    // Close modal when clicking outside
    document.getElementById('landModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    document.getElementById('confirmModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeConfirmModal();
        }
    });

    document.getElementById('categoryModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeCategoryModal();
        }
    });

    document.getElementById('allLandsModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeAllLandsModal();
        }
    });

    // Close user dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.user-menu')) {
            const dropdown = document.getElementById('userDropdown');
            dropdown.classList.add('opacity-0', 'invisible', '-translate-y-2');
            dropdown.classList.remove('opacity-100', 'visible', 'translate-y-0');
        }
    });
}

async function loadDashboard() {
    showLoading(true);
    
    try {
        const response = await fetch('/api/lands');
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/';
                return;
            }
            throw new Error('Failed to load lands');
        }
        
        const data = await response.json();
        allLands = data.lands;
        
        renderDashboardTiles(data.counts);
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showToast('Error loading dashboard data', 'error');
    } finally {
        showLoading(false);
    }
}

function renderDashboardTiles(counts) {
    const dashboardGrid = document.getElementById('dashboardGrid');
    const areaRanges = [
        '0-25 gaj', '25-50 gaj', '50-75 gaj', '75-100 gaj',
        '100-250 gaj', '250-500 gaj', '500-750 gaj', '750-1000 gaj'
    ];
    
    dashboardGrid.innerHTML = '';
    
    areaRanges.forEach((range, index) => {
        const count = counts[range] || 0;
        const tile = createDashboardTile(range, count, index);
        dashboardGrid.appendChild(tile);
    });
}

function createDashboardTile(range, count, index) {
    const tile = document.createElement('div');
    tile.className = 'bg-white rounded-xl p-4 sm:p-6 shadow-lg cursor-pointer transition-all duration-300 border-2 border-transparent relative overflow-hidden hover:-translate-y-1 hover:shadow-2xl hover:border-primary-500 transform hover:scale-105';
    tile.onclick = () => showCategoryModal(range);
    
    // Add gradient top border
    const topBorder = document.createElement('div');
    topBorder.className = 'absolute top-0 left-0 right-0 h-1 gradient-bg';
    tile.appendChild(topBorder);
    
    const icons = [
        'fa-home', 'fa-building', 'fa-warehouse', 'fa-industry',
        'fa-city', 'fa-mountain', 'fa-globe', 'fa-map'
    ];
    
    tile.innerHTML += `
        <div class="flex justify-between items-center mb-3 sm:mb-4">
            <div class="w-10 h-10 sm:w-12 sm:h-12 gradient-bg rounded-lg flex items-center justify-center text-white text-lg sm:text-xl">
                <i class="fas ${icons[index]}"></i>
            </div>
            <div class="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-500">${count}</div>
        </div>
        <div class="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-1">${range}</div>
        <div class="text-gray-600 text-xs sm:text-sm">Tap to view details</div>
    `;
    
    return tile;
}

async function showCategoryModal(category) {
    currentCategory = category;
    showLoading(true);
    
    try {
        const response = await fetch(`/api/lands/${encodeURIComponent(category)}`);
        if (!response.ok) throw new Error('Failed to load category lands');
        
        const categoryLands = await response.json();
        
        document.getElementById('categoryModalTitle').textContent = `${category} (${categoryLands.length} Properties)`;
        renderCategoryTable(categoryLands);
        
        const modal = document.getElementById('categoryModal');
        modal.classList.add('flex');
        modal.classList.remove('hidden');
        
    } catch (error) {
        console.error('Error loading category details:', error);
        showToast('Error loading category details', 'error');
    } finally {
        showLoading(false);
    }
}

function closeCategoryModal() {
    const modal = document.getElementById('categoryModal');
    modal.classList.remove('flex');
    modal.classList.add('hidden');
    currentCategory = '';
}

function renderCategoryTable(lands) {
    const tableBody = document.getElementById('categoryTableBody');
    tableBody.innerHTML = '';
    
    if (lands.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-8 sm:py-10 text-gray-600">
                    <i class="fas fa-inbox text-3xl sm:text-5xl mb-3 sm:mb-4 block text-gray-400"></i>
                    <div class="text-sm sm:text-base">No properties found in this category</div>
                </td>
            </tr>
        `;
        return;
    }
    
    lands.forEach(land => {
        const row = document.createElement('tr');
        row.className = 'transition-all duration-300 hover:bg-primary-50 hover:shadow-md even:bg-gray-50';
        
        row.innerHTML = `
            <td class="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm border-b border-gray-200">
                <div class="font-semibold text-gray-800">${land.name || 'Unnamed Property'}</div>
                <div class="text-gray-600 text-xs sm:hidden mt-1">${land.landmark || 'No landmark'}</div>
            </td>
            <td class="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm border-b border-gray-200 hidden sm:table-cell">
                ${land.landmark || 'No landmark specified'}
            </td>
            <td class="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm border-b border-gray-200">
                <span class="px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide condition-${land.condition.toLowerCase().replace(' ', '-')}">
                    ${land.condition}
                </span>
            </td>
            <td class="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm border-b border-gray-200">
                <div class="flex gap-1 sm:gap-2 justify-center">
                    <button class="bg-blue-500 text-white p-1 sm:p-2 rounded text-xs transition-all duration-300 hover:bg-blue-600 hover:scale-110" onclick="event.stopPropagation(); window.open('${land.mapLink}', '_blank')" title="View on Map">
                        <i class="fas fa-map-marker-alt"></i>
                    </button>
                    <button class="bg-green-500 text-white p-1 sm:p-2 rounded text-xs transition-all duration-300 hover:bg-green-600 hover:scale-110" onclick="event.stopPropagation(); editLand('${land.id}')" title="Edit Property">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="bg-red-500 text-white p-1 sm:p-2 rounded text-xs transition-all duration-300 hover:bg-red-600 hover:scale-110" onclick="event.stopPropagation(); deleteLand('${land.id}')" title="Delete Property">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

async function showAllLands() {
    showLoading(true);
    
    try {
        const response = await fetch('/api/lands/all');
        if (!response.ok) throw new Error('Failed to load all lands');
        
        const data = await response.json();
        renderAllLandsModal(data.groupedLands, data.totalCount);
        
        const modal = document.getElementById('allLandsModal');
        modal.classList.add('flex');
        modal.classList.remove('hidden');
        
    } catch (error) {
        console.error('Error loading all lands:', error);
        showToast('Error loading all lands', 'error');
    } finally {
        showLoading(false);
    }
}

function closeAllLandsModal() {
    const modal = document.getElementById('allLandsModal');
    modal.classList.remove('flex');
    modal.classList.add('hidden');
}

function renderAllLandsModal(groupedLands, totalCount) {
    const container = document.getElementById('allLandsContainer');
    container.innerHTML = `
        <div class="mb-4 sm:mb-6 text-center">
            <h4 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Total Properties: ${totalCount}</h4>
            <p class="text-gray-600 text-sm sm:text-base">Properties organized by area ranges</p>
        </div>
    `;
    
    const areaRanges = [
        '0-25 gaj', '25-50 gaj', '50-75 gaj', '75-100 gaj',
        '100-250 gaj', '250-500 gaj', '500-750 gaj', '750-1000 gaj'
    ];
    
    areaRanges.forEach((range, index) => {
        const lands = groupedLands[range] || [];
        if (lands.length > 0) {
            const section = document.createElement('div');
            section.className = 'mb-6 sm:mb-8 bg-gray-50 rounded-xl p-4 sm:p-6';
            
            section.innerHTML = `
                <div class="flex justify-between items-center mb-4 cursor-pointer" onclick="toggleRangeSection('${range}')">
                    <h5 class="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <i class="fas fa-expand-arrows-alt text-primary-500"></i>
                        ${range} (${lands.length} properties)
                    </h5>
                    <i class="fas fa-chevron-down text-gray-500 transition-transform duration-300" id="chevron-${range.replace(' ', '-')}"></i>
                </div>
                <div class="space-y-3 hidden" id="section-${range.replace(' ', '-')}">
                    ${lands.map(land => `
                        <div class="bg-white rounded-lg p-3 sm:p-4 transition-all duration-300 hover:shadow-md border border-gray-200">
                            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <div class="flex-1">
                                    <h6 class="font-semibold text-gray-800 text-sm sm:text-base">${land.name || 'Unnamed Property'}</h6>
                                    <p class="text-gray-600 text-xs sm:text-sm">${land.landmark || 'No landmark specified'}</p>
                                </div>
                                <div class="flex items-center gap-2 sm:gap-3">
                                    <span class="px-2 py-1 rounded-full text-xs font-semibold uppercase condition-${land.condition.toLowerCase().replace(' ', '-')}">
                                        ${land.condition}
                                    </span>
                                    <div class="flex gap-1">
                                        <button class="bg-blue-500 text-white p-1 rounded text-xs transition-all duration-300 hover:bg-blue-600" onclick="window.open('${land.mapLink}', '_blank')" title="View on Map">
                                            <i class="fas fa-map-marker-alt"></i>
                                        </button>
                                        <button class="bg-green-500 text-white p-1 rounded text-xs transition-all duration-300 hover:bg-green-600" onclick="editLand('${land.id}')" title="Edit">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="bg-red-500 text-white p-1 rounded text-xs transition-all duration-300 hover:bg-red-600" onclick="deleteLand('${land.id}')" title="Delete">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            container.appendChild(section);
        }
    });
}

function toggleRangeSection(range) {
    const section = document.getElementById(`section-${range.replace(' ', '-')}`);
    const chevron = document.getElementById(`chevron-${range.replace(' ', '-')}`);
    
    if (section.classList.contains('hidden')) {
        section.classList.remove('hidden');
        chevron.style.transform = 'rotate(180deg)';
    } else {
        section.classList.add('hidden');
        chevron.style.transform = 'rotate(0deg)';
    }
}

function openAddModal() {
    isEditMode = false;
    editingLandId = null;
    document.getElementById('modalTitle').textContent = 'Add New Land';
    document.getElementById('submitBtnText').textContent = 'Add Land';
    document.getElementById('landForm').reset();
    document.getElementById('landId').value = '';
    document.getElementById('landModal').classList.add('flex');
    document.getElementById('landModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('landModal').classList.remove('flex');
    document.getElementById('landModal').classList.add('hidden');
    document.getElementById('landForm').reset();
    isEditMode = false;
    editingLandId = null;
}

function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('opacity-0');
    dropdown.classList.toggle('invisible');
    dropdown.classList.toggle('-translate-y-2');
    dropdown.classList.toggle('show');
}

async function editLand(landId) {
    // Don't close table modals - keep them open behind the edit form
    
    const land = allLands.find(l => l.id === landId);
    if (!land) {
        showToast('Land not found', 'error');
        return;
    }
    
    isEditMode = true;
    editingLandId = landId;
    
    document.getElementById('modalTitle').textContent = 'Edit Land';
    document.getElementById('submitBtnText').textContent = 'Update Land';
    document.getElementById('landId').value = landId;
    document.getElementById('name').value = land.name || '';
    document.getElementById('landmark').value = land.landmark || '';
    document.getElementById('areaRange').value = land.areaRange;
    document.getElementById('condition').value = land.condition;
    document.getElementById('latitude').value = land.latitude;
    document.getElementById('longitude').value = land.longitude;
    
    document.getElementById('landModal').classList.add('flex');
    document.getElementById('landModal').classList.remove('hidden');
}

function deleteLand(landId) {
    const land = allLands.find(l => l.id === landId);
    if (!land) {
        showToast('Land not found', 'error');
        return;
    }
    
    showConfirmModal(
        'Delete Land',
        `Are you sure you want to delete this land property? This action cannot be undone.`,
        () => performDeleteLand(landId)
    );
}

async function performDeleteLand(landId) {
    showLoading(true);
    
    try {
        const response = await fetch(`/api/lands/${landId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Land deleted successfully', 'success');
            await loadDashboard();
            
            // Refresh the table modal that was open
            if (currentCategory) {
                await showCategoryModal(currentCategory);
            }
            
            // Also refresh All Lands modal if it's open
            if (document.getElementById('allLandsModal').classList.contains('flex')) {
                await showAllLands();
            }
        } else {
            showToast(result.message || 'Error deleting land', 'error');
        }
    } catch (error) {
        console.error('Error deleting land:', error);
        showToast('Network error. Please try again.', 'error');
    } finally {
        showLoading(false);
        closeConfirmModal();
    }
}

async function handleLandSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const landData = {
        name: formData.get('name'),
        landmark: formData.get('landmark'),
        areaRange: formData.get('areaRange'),
        condition: formData.get('condition'),
        latitude: formData.get('latitude'),
        longitude: formData.get('longitude')
    };
    
    // Validation
    if (!landData.name || !landData.landmark || !landData.areaRange || !landData.condition || !landData.latitude || !landData.longitude) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    if (isNaN(landData.latitude) || isNaN(landData.longitude)) {
        showToast('Please enter valid coordinates', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const url = isEditMode ? `/api/lands/${editingLandId}` : '/api/lands';
        const method = isEditMode ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(landData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            const message = isEditMode ? 'Land updated successfully!' : 'Land added successfully!';
            showToast(message, 'success');
            closeModal();
            await loadDashboard();
            
            // Refresh the table modal that was open behind the edit form
            if (currentCategory) {
                await showCategoryModal(currentCategory);
            }
            
            // Also refresh All Lands modal if it's open
            if (document.getElementById('allLandsModal').classList.contains('flex')) {
                await showAllLands();
            }
        } else {
            showToast(result.message || 'Error saving land', 'error');
        }
    } catch (error) {
        console.error('Error saving land:', error);
        showToast('Network error. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

function getCurrentLocation() {
    if (!navigator.geolocation) {
        showToast('Geolocation is not supported by this browser', 'error');
        return;
    }
    
    // Show loading state specifically for the location button
    const locationBtn = document.getElementById('locationBtn');
    if (!locationBtn) {
        showToast('Location button not found', 'error');
        return;
    }
    
    const originalText = locationBtn.innerHTML;
    locationBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Detecting...';
    locationBtn.disabled = true;
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            try {
                document.getElementById('latitude').value = position.coords.latitude.toFixed(6);
                document.getElementById('longitude').value = position.coords.longitude.toFixed(6);
                showToast('Location retrieved successfully', 'success');
            } catch (error) {
                console.error('Error setting coordinates:', error);
                showToast('Error setting coordinates', 'error');
            } finally {
                // Reset button state
                locationBtn.innerHTML = originalText;
                locationBtn.disabled = false;
            }
        },
        (error) => {
            console.error('Geolocation error:', error);
            let message = 'Error getting location';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    message = 'Location access denied by user';
                    break;
                case error.POSITION_UNAVAILABLE:
                    message = 'Location information unavailable';
                    break;
                case error.TIMEOUT:
                    message = 'Location request timed out';
                    break;
            }
            showToast(message, 'error');
            
            // Reset button state
            locationBtn.innerHTML = originalText;
            locationBtn.disabled = false;
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        }
    );
}

function showConfirmModal(title, message, onConfirm) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmBtn').onclick = onConfirm;
    document.getElementById('confirmModal').classList.add('flex');
    document.getElementById('confirmModal').classList.remove('hidden');
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('flex');
    document.getElementById('confirmModal').classList.add('hidden');
}

async function logout() {
    showConfirmModal(
        'Logout',
        'Are you sure you want to logout?',
        async () => {
            try {
                await fetch('/api/logout', { method: 'POST' });
                window.location.href = '/';
            } catch (error) {
                console.error('Logout error:', error);
                window.location.href = '/';
            }
        }
    );
}

async function exportData() {
    try {
        showLoading(true);
        const response = await fetch('/api/export');
        
        if (!response.ok) throw new Error('Export failed');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lands_data_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast('Data exported successfully', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showToast('Error exporting data', 'error');
    } finally {
        showLoading(false);
    }
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    // Remove previous type classes
    toast.classList.remove('bg-green-500', 'bg-red-500', 'bg-blue-500', 'bg-yellow-500');
    
    // Set content and color based on type
    let icon = '';
    switch(type) {
        case 'success':
            toast.classList.add('bg-green-500');
            icon = '✓';
            break;
        case 'error':
            toast.classList.add('bg-red-500');
            icon = '✗';
            break;
        case 'warning':
            toast.classList.add('bg-yellow-500');
            icon = '⚠';
            break;
        default:
            toast.classList.add('bg-blue-500');
            icon = 'ℹ';
    }
    
    toast.innerHTML = `<span class="mr-2">${icon}</span>${message}`;
    
    // Show toast with animation
    toast.classList.remove('translate-x-96');
    toast.classList.add('translate-x-0');
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('translate-x-0');
        toast.classList.add('translate-x-96');
    }, 3000);
}

function showLoading(show) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (show) {
        loadingSpinner.classList.remove('hidden');
        loadingSpinner.classList.add('flex');
    } else {
        loadingSpinner.classList.remove('flex');
        loadingSpinner.classList.add('hidden');
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // ESC to close modals
    if (e.key === 'Escape') {
        if (document.getElementById('landModal').classList.contains('flex')) {
            closeModal();
        }
        if (document.getElementById('confirmModal').classList.contains('flex')) {
            closeConfirmModal();
        }
        if (document.getElementById('categoryModal').classList.contains('flex')) {
            closeCategoryModal();
        }
        if (document.getElementById('allLandsModal').classList.contains('flex')) {
            closeAllLandsModal();
        }
        // Close user dropdown
        const dropdown = document.getElementById('userDropdown');
        dropdown.classList.add('opacity-0', 'invisible', '-translate-y-2');
        dropdown.classList.remove('opacity-100', 'visible', 'translate-y-0');
    }
    
    // Ctrl+N to add new land
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        openAddModal();
    }
    
    // Ctrl+E to export
    if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        exportData();
    }
    
    // Ctrl+A to show all lands
    if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        showAllLands();
    }
});

// Auto-refresh data every 5 minutes
setInterval(() => {
    loadDashboard();
}, 5 * 60 * 1000);

// Export data function
function exportData() {
    try {
        const csvContent = [
            ['Name', 'Landmark', 'Area Range', 'Condition', 'Latitude', 'Longitude', 'Created At'].join(','),
            ...allLands.map(land => [
                `"${(land.name || '').replace(/"/g, '""')}"`,
                `"${(land.landmark || '').replace(/"/g, '""')}"`,
                `"${land.areaRange || ''}"`,
                `"${land.condition || ''}"`,
                land.latitude || '',
                land.longitude || '',
                new Date(land.createdAt).toLocaleString()
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `lands_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('Data exported successfully!', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showToast('Export failed. Please try again.', 'error');
    }
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('userToken');
        sessionStorage.clear();
        window.location.href = 'login.html';
    }
}

// Close user menu when clicking outside
document.addEventListener('click', function(e) {
    const userMenu = document.querySelector('.user-menu');
    const dropdown = document.getElementById('userDropdown');
    
    if (userMenu && !userMenu.contains(e.target)) {
        dropdown.classList.add('opacity-0', 'invisible', '-translate-y-2');
        dropdown.classList.remove('show');
    }
});
