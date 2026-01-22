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
    parseNumber(value) {
        if (typeof value === 'number') return value;
        const cleaned = String(value).replace(/,/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    },

    formatNumber(num) {
        const value = typeof num === 'number' ? num : this.parseNumber(num);
        return Math.ceil(value).toLocaleString('en-US');
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
                    type="text" 
                    inputmode="numeric"
                    class="item-input essence-input"
                    id="essence-${essence.name}" 
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
        const saldo = Utils.parseNumber(DOM.saldoInput.value);
        const meta = Utils.parseNumber(DOM.metaInput.value);
        let totalVenta = 0;

        document.querySelectorAll('.essence-input').forEach(input => {
            const quantity = Utils.parseNumber(input.value);
            const price = parseFloat(input.dataset.price);
            totalVenta += quantity * price;
        });

        const nuevoBalance = saldo + totalVenta;
        const faltante = meta - nuevoBalance;

        DOM.totalVenta.textContent = Utils.formatNumber(totalVenta);
        DOM.nuevoBalance.textContent = Utils.formatNumber(nuevoBalance);

        this.updateStatus(saldo, meta, nuevoBalance, faltante);

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
    handleConfigInput(event) {
        Calculator.calculate();
    },

    handleEssenceInput(event) {
        const input = event.target;
        const numericValue = Utils.parseNumber(input.value);
        
        if (numericValue === 0) {
            input.classList.add('zero');
        } else {
            input.classList.remove('zero');
        }
        
        const essenceName = input.dataset.name;
        appState.updateQuantity(essenceName, numericValue);
        
        Calculator.calculate();
    },

    handleQuantityButton(event) {
        const button = event.currentTarget;
        const essenceName = button.dataset.essence;
        const input = document.getElementById(`essence-${essenceName}`);
        
        if (!input) return;

        let currentValue = Utils.parseNumber(input.value);

        if (button.classList.contains('qty-plus')) {
            currentValue++;
        } else if (button.classList.contains('qty-minus') && currentValue > 0) {
            currentValue--;
        }

        input.value = Utils.formatNumber(currentValue);

        if (currentValue === 0) {
            input.classList.add('zero');
        } else {
            input.classList.remove('zero');
        }
        
        appState.updateQuantity(essenceName, currentValue);
        Calculator.calculate();

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
        const rows = [
            ['Esencia', 'Cantidad', 'Precio', 'Total']
        ];
    
        ESSENCES_DATA.forEach(essence => {
            const qty = appState.data.quantities[essence.name] || 0;
            if (qty > 0) {
                rows.push([
                    essence.name,
                    qty,
                    essence.price,
                    qty * essence.price
                ]);
            }
        });
    
        const worksheet = XLSX.utils.aoa_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
    
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Resumen');
    
        worksheet['!cols'] = [
            { wch: 20 },
            { wch: 12 },
            { wch: 10 },
            { wch: 14 }
        ];
    
        XLSX.writeFile(
            workbook,
            `forge-resumen-${Date.now()}.xlsx`
        );
    
        UI.showToast('📊 Excel exportado correctamente');
    }    
};

// ========================================
// INITIALIZATION
// ========================================
const App = {
    init() {
        console.log('🚀 Initializing Forge Calculator...');
        
        this.renderEssences();
        this.setupEventListeners();
        this.loadSavedData();
        Calculator.calculate();
        this.setupAnimations();
        
        console.log('✅ Forge Calculator initialized successfully');
    },

    renderEssences() {
        ESSENCES_DATA.forEach((essence, index) => {
            const card = UI.createEssenceCard(essence);
            card.style.animationDelay = `${index * 0.05}s`;
            DOM.itemsGrid.appendChild(card);
        });
    },

    setupEventListeners() {
        // Config inputs: calcular en tiempo real, formatear al salir
        DOM.saldoInput.addEventListener('input', EventHandlers.handleConfigInput);
        DOM.metaInput.addEventListener('input', EventHandlers.handleConfigInput);
        
        DOM.saldoInput.addEventListener('blur', EventHandlers.handleConfigBlur);
        DOM.metaInput.addEventListener('blur', EventHandlers.handleConfigBlur);

        // Essence inputs: con debounce
        const debouncedEssence = Utils.debounce((e) => {
            EventHandlers.handleEssenceInput(e);
        }, 150);
        
        document.querySelectorAll('.essence-input').forEach(input => {
            input.addEventListener('input', debouncedEssence);
            input.addEventListener('blur', EventHandlers.handleEssenceBlur);
        });

        document.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', EventHandlers.handleQuantityButton);
        });

        DOM.btnSave.addEventListener('click', EventHandlers.handleSave);
        DOM.btnClear.addEventListener('click', EventHandlers.handleClear);
        DOM.btnExport.addEventListener('click', EventHandlers.handleExport);

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                EventHandlers.handleSave();
            }
        });
    },

    loadSavedData() {
        if (appState.load()) {
            const data = appState.data;
            
            DOM.saldoInput.value = Utils.formatNumber(data.saldo || 0);
            DOM.metaInput.value = Utils.formatNumber(data.meta || 0);
            
            for (const [essenceName, quantity] of Object.entries(data.quantities)) {
                const input = document.getElementById(`essence-${essenceName}`);
                if (input) {
                    input.value = Utils.formatNumber(quantity);
                    if (quantity === 0) {
                        input.classList.add('zero');
                    }
                }
            }
            
            console.log('📂 Saved data loaded successfully');
            UI.showToast('📂 Datos cargados correctamente');
        }
    },

    setupAnimations() {
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Calculator,
        Utils,
        AppState
    };
}