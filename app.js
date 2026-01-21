// ========================================
// DATA CONFIGURATION
// ========================================
const ESSENCES_DATA = [
    { 
        name: "Minúscula", 
        price: 2.5, 
        img: "https://static.wikitide.net/theforgewiki/e/ef/TinyEssence.png" 
    },
    { 
        name: "Pequeña", 
        price: 5, 
        img: "https://static.wikitide.net/theforgewiki/8/84/SmallEssence.png" 
    },
    { 
        name: "Mediana", 
        price: 15, 
        img: "https://static.wikitide.net/theforgewiki/thumb/3/38/MediumEssence.png/100px-MediumEssence.png" 
    },
    { 
        name: "Grande", 
        price: 35, 
        img: "https://static.wikitide.net/theforgewiki/thumb/3/33/LargeEssence.png/100px-LargeEssence.png" 
    },
    { 
        name: "Mayor", 
        price: 50, 
        img: "https://static.wikitide.net/theforgewiki/thumb/3/3c/GreaterEssence.png/100px-GreaterEssence.png" 
    },
    { 
        name: "Superior", 
        price: 75, 
        img: "https://static.wikitide.net/theforgewiki/thumb/6/6b/SuperiorEssence.png/100px-SuperiorEssence.png" 
    },
    { 
        name: "Épica", 
        price: 100, 
        img: "https://static.wikitide.net/theforgewiki/thumb/8/89/EpicEssence.png/100px-EpicEssence.png" 
    }
];

const STORAGE_KEY = 'esencias_forge_data_v4';

// ========================================
// DOM ELEMENTS CACHE
// ========================================
const DOM = {
    itemsGrid: document.getElementById('items-grid'),
    saldoInput: document.getElementById('saldo-inicial'),
    metaInput: document.getElementById('meta-valor'),
    totalVenta: document.getElementById('total-venta'),
    nuevoBalance: document.getElementById('nuevo-balance'),
    statusMessage: document.getElementById('status-message'),
    statusText: document.querySelector('.status-text'),
    statusIcon: document.querySelector('.status-icon'),
    recommendationsSection: document.getElementById('recommendations'),
    recommendationsGrid: document.getElementById('recommendations-grid'),
    btnSave: document.getElementById('btn-save'),
    btnClear: document.getElementById('btn-clear'),
    btnExport: document.getElementById('btn-export'),
    toast: document.getElementById('toast'),
    toastMessage: document.querySelector('.toast-message')
};

// ========================================
// STATE MANAGEMENT
// ========================================
class AppState {
    constructor() {
        this.data = {
            saldo: 0,
            meta: 0,
            quantities: {}
        };
    }

    update(key, value) {
        this.data[key] = value;
    }

    updateQuantity(essenceName, quantity) {
        this.data.quantities[essenceName] = quantity;
    }

    save() {
        try {
            // Using in-memory storage instead of localStorage
            window.forgeCalculatorData = JSON.stringify(this.data);
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }

    load() {
        try {
            const savedData = window.forgeCalculatorData;
            if (savedData) {
                this.data = JSON.parse(savedData);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error loading data:', error);
            return false;
        }
    }

    clear() {
        this.data = {
            saldo: 0,
            meta: 0,
            quantities: {}
        };
        window.forgeCalculatorData = null;
    }

    export() {
        return {
            ...this.data,
            timestamp: new Date().toISOString(),
            version: '4.0'
        };
    }
}

const appState = new AppState();

// ========================================
// UTILITY FUNCTIONS
// ========================================
const Utils = {
    formatNumber(num) {
        return Math.ceil(num).toLocaleString('de-DE');
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    animate(element, className, duration = 300) {
        element.classList.add(className);
        setTimeout(() => {
            element.classList.remove(className);
        }, duration);
    }
};

// ========================================
// UI COMPONENTS
// ========================================
const UI = {
    createEssenceCard(essence) {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.setAttribute('data-aos', 'fade-up');
        
        card.innerHTML = `
            <div class="item-info">
                <img src="${essence.img}" 
                     class="essence-img" 
                     alt="${essence.name}"
                     loading="lazy">
                <div class="item-details">
                    <div class="item-name">${essence.name}</div>
                    <div class="item-price">$${essence.price}</div>
                </div>
            </div>
            <div class="quantity-control">
                <button class="qty-btn qty-minus" data-essence="${essence.name}" type="button" aria-label="Disminuir">−</button>
                <input 
                    type="number" 
                    class="item-input essence-input" 
                    id="essence-${essence.name}" 
                    min="0" 
                    step="1"
                    value="0"
                    data-price="${essence.price}"
                    data-name="${essence.name}"
                >
                <button class="qty-btn qty-plus" data-essence="${essence.name}" type="button" aria-label="Aumentar">+</button>
            </div>
        `;
        
        return card;
    },

    createRecommendationItem(essence, units, isOptimal) {
        const item = document.createElement('div');
        item.className = `recommendation-item ${isOptimal ? 'optimal' : ''}`;
        item.innerHTML = `
            <div>${essence.name}</div>
            <div><b>${Utils.formatNumber(units)}</b> unidades</div>
        `;
        return item;
    },

    showToast(message, duration = 3000) {
        DOM.toastMessage.textContent = message;
        DOM.toast.classList.add('show');
        
        setTimeout(() => {
            DOM.toast.classList.remove('show');
        }, duration);
    },

    updateStatus(isSuccess, message, icon) {
        DOM.statusText.textContent = message;
        DOM.statusIcon.textContent = icon;
        DOM.statusMessage.className = `status-message ${isSuccess ? 'status-success' : 'status-error'}`;
    }
};

// ========================================
// CALCULATOR LOGIC
// ========================================
const Calculator = {
    calculate() {
        const saldo = parseFloat(DOM.saldoInput.value) || 0;
        const meta = parseFloat(DOM.metaInput.value) || 0;
        let totalVenta = 0;

        // Calculate total sales
        document.querySelectorAll('.essence-input').forEach(input => {
            const quantity = parseFloat(input.value) || 0;
            const price = parseFloat(input.dataset.price);
            totalVenta += quantity * price;
        });

        const nuevoBalance = saldo + totalVenta;
        const faltante = meta - nuevoBalance;

        // Update UI
        DOM.totalVenta.textContent = Utils.formatNumber(totalVenta);
        DOM.nuevoBalance.textContent = Utils.formatNumber(nuevoBalance);

        // Update status
        this.updateStatus(saldo, meta, nuevoBalance, faltante);

        // Auto-save state
        appState.update('saldo', saldo);
        appState.update('meta', meta);
        appState.save();
    },

    updateStatus(saldo, meta, total, faltante) {
        if (meta === 0) {
            UI.updateStatus(true, 'Ingresa tus datos para comenzar', 'ℹ️');
            DOM.recommendationsSection.classList.add('hidden');
        } else if (total >= meta) {
            const exceso = total - meta;
            UI.updateStatus(
                true, 
                `¡META LOGRADA! Excedente: ${Utils.formatNumber(exceso)}`, 
                '🎉'
            );
            DOM.recommendationsSection.classList.add('hidden');
        } else {
            UI.updateStatus(
                false, 
                `Faltan: ${Utils.formatNumber(faltante)} para alcanzar tu meta`, 
                '⚠️'
            );
            this.showRecommendations(faltante);
        }
    },

    showRecommendations(faltante) {
        DOM.recommendationsSection.classList.remove('hidden');
        DOM.recommendationsGrid.innerHTML = '';

        // Create recommendations sorted by price (highest first)
        [...ESSENCES_DATA].reverse().forEach(essence => {
            const units = Math.ceil(faltante / essence.price);
            const isOptimal = essence.name === "Épica";
            const item = UI.createRecommendationItem(essence, units, isOptimal);
            DOM.recommendationsGrid.appendChild(item);
        });
    }
};

// ========================================
// EVENT HANDLERS
// ========================================
const EventHandlers = {
    handleInputChange(event) {
        const input = event.target;
        
        // Validate input
        if (input.value < 0) {
            input.value = 0;
        }

        // Update state if it's an essence input
        if (input.classList.contains('essence-input')) {
            const essenceName = input.dataset.name;
            appState.updateQuantity(essenceName, input.value);
        }

        Calculator.calculate();
    },

    handleQuantityButton(event) {
        const button = event.currentTarget;
        const essenceName = button.dataset.essence;
        const input = document.getElementById(`essence-${essenceName}`);
        
        if (!input) return;

        let currentValue = parseInt(input.value) || 0;

        // Increment or decrement based on button type
        if (button.classList.contains('qty-plus')) {
            currentValue++;
        } else if (button.classList.contains('qty-minus') && currentValue > 0) {
            currentValue--;
        }

        // Update input value
        input.value = currentValue;

        // Update state
        appState.updateQuantity(essenceName, currentValue);

        // Recalculate
        Calculator.calculate();

        // Visual feedback
        button.style.transform = 'scale(0.9)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
    },

    handleSave() {
        if (appState.save()) {
            UI.showToast('✅ Progreso guardado exitosamente');
        } else {
            UI.showToast('❌ Error al guardar el progreso');
        }
    },

    handleClear() {
        const confirmed = confirm('¿Estás seguro de que deseas borrar todo el progreso?');
        
        if (confirmed) {
            appState.clear();
            window.location.reload();
        }
    },

    handleExport() {
        try {
            const exportData = appState.export();
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `forge-calculator-${Date.now()}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            UI.showToast('📤 Datos exportados exitosamente');
        } catch (error) {
            console.error('Error exporting data:', error);
            UI.showToast('❌ Error al exportar los datos');
        }
    }
};

// ========================================
// INITIALIZATION
// ========================================
const App = {
    init() {
        console.log('🚀 Initializing Forge Calculator...');
        
        // Render essence cards
        this.renderEssences();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load saved data
        this.loadSavedData();
        
        // Initial calculation
        Calculator.calculate();
        
        // Add animation on scroll
        this.setupAnimations();
        
        console.log('✅ Forge Calculator initialized successfully');
    },

    renderEssences() {
        ESSENCES_DATA.forEach((essence, index) => {
            const card = UI.createEssenceCard(essence);
            // Stagger animation
            card.style.animationDelay = `${index * 0.05}s`;
            DOM.itemsGrid.appendChild(card);
        });
    },

    setupEventListeners() {
        // Input changes (with debouncing for performance)
        const debouncedCalculate = Utils.debounce((e) => {
            EventHandlers.handleInputChange(e);
        }, 300);

        DOM.saldoInput.addEventListener('input', debouncedCalculate);
        DOM.metaInput.addEventListener('input', debouncedCalculate);
        
        document.querySelectorAll('.essence-input').forEach(input => {
            input.addEventListener('input', debouncedCalculate);
        });

        // Quantity buttons (+ and -)
        document.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', EventHandlers.handleQuantityButton);
        });

        // Button clicks
        DOM.btnSave.addEventListener('click', EventHandlers.handleSave);
        DOM.btnClear.addEventListener('click', EventHandlers.handleClear);
        DOM.btnExport.addEventListener('click', EventHandlers.handleExport);

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 's') {
                    e.preventDefault();
                    EventHandlers.handleSave();
                }
            }
        });
    },

    loadSavedData() {
        if (appState.load()) {
            const data = appState.data;
            
            // Restore inputs
            DOM.saldoInput.value = data.saldo || 0;
            DOM.metaInput.value = data.meta || 0;
            
            // Restore essence quantities
            for (const [essenceName, quantity] of Object.entries(data.quantities)) {
                const input = document.getElementById(`essence-${essenceName}`);
                if (input) {
                    input.value = quantity;
                }
            }
            
            console.log('📂 Saved data loaded successfully');
            UI.showToast('📂 Datos cargados correctamente');
        }
    },

    setupAnimations() {
        // Add intersection observer for scroll animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, {
            threshold: 0.1
        });

        document.querySelectorAll('[data-aos]').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }
};

// ========================================
// START APPLICATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// ========================================
// EXPORT FOR TESTING (Optional)
// ========================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Calculator,
        Utils,
        AppState
    };
}