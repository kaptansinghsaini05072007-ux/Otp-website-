class OTPService {
    constructor() {
        // API Key already set
        this.apiKey = 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3OTQyMDk4NjQsImlhdCI6MTc2MjY3Mzg2NCwicmF5IjoiOTMwN2EwYTk3ZTBlODEzYjM1NzJkMWJlNGI5YzFlNjQiLCJzdWIiOjMwOTA0Mzl9.DSBVHlWaSFPHLdfRYquEXaI5-1K7DFMG7s7N4W3qHumEy7YYpfmnG6RxgaIgOwgFlGsu4JPA4P_fUw6JvTizOhlbo75TT2-H1Z-8cF44meKBa0jr1CjvjEmwV3a6okY02UgEDGx9fHQIRegBNCG2okHoCWJWBJ1RCUu-vCcDl7c4CAQagNmCkfDNzx8JXDG3iHYir_gOROzxf9HUlC5dbzNze9IhuPce64SLGPls60wfD2W8D4XeoNc1uay0KqmcdWGrACn1zLNzFZPnYqs5cWtByLRwFqN-kwm1BwtqI8mP-ZK5-66qqhakP7K96N0ocmFGLnCa-5a4e0fTMTGQZw';
        this.baseURL = 'https://5sim.net/v1/';
        this.currentOrder = null;
        this.pollInterval = null;
        this.userBalance = 50.00; // ₹50 test balance
        this.priceMultiplier = 1.75; // 1.75x margin
        
        this.init();
    }
    
    async init() {
        await this.loadCountries();
        this.setupEventListeners();
        this.updateBalanceDisplay();
    }
    
    setupEventListeners() {
        document.getElementById('countrySelect').addEventListener('change', (e) => {
            this.onCountryChange(e.target.value);
        });
        
        document.getElementById('serviceSelect').addEventListener('change', (e) => {
            this.onServiceChange(e.target.value);
        });
    }
    
    async loadCountries() {
        try {
            const response = await this.makeRequest('guest/products');
            this.populateCountries(response);
        } catch (error) {
            console.error('Error loading countries:', error);
            this.showError('Failed to load countries. Using demo data.');
            this.loadDemoCountries();
        }
    }
    
    populateCountries(countriesData) {
        const countrySelect = document.getElementById('countrySelect');
        countrySelect.innerHTML = '<option value="">Select Country</option>';
        
        Object.keys(countriesData).forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = this.formatCountryName(country);
            countrySelect.appendChild(option);
        });
    }
    
    loadDemoCountries() {
        const demoCountries = ['india', 'usa', 'uk', 'russia', 'brazil', 'indonesia'];
        const countrySelect = document.getElementById('countrySelect');
        countrySelect.innerHTML = '<option value="">Select Country</option>';
        
        demoCountries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = this.formatCountryName(country);
            countrySelect.appendChild(option);
        });
    }
    
    async onCountryChange(country) {
        if (!country) {
            document.getElementById('serviceSelect').innerHTML = '<option value="">Select country first</option>';
            document.getElementById('operatorSelect').innerHTML = '<option value="any">Any Operator</option>';
            this.hidePrice();
            return;
        }
        
        try {
            const services = await this.loadServices(country);
            this.populateServices(services, country);
            this.loadOperators(country);
        } catch (error) {
            console.error('Error loading services:', error);
            this.loadDemoServices(country);
        }
    }
    
    async loadServices(country) {
        const response = await this.makeRequest(`guest/products/${country}`);
        return response;
    }
    
    populateServices(servicesData, country) {
        const serviceSelect = document.getElementById('serviceSelect');
        serviceSelect.innerHTML = '<option value="">Select Service</option>';
        
        Object.keys(servicesData).forEach(service => {
            if (servicesData[service].Category === 'activation') {
                const option = document.createElement('option');
                option.value = service;
                option.textContent = this.formatServiceName(service);
                serviceSelect.appendChild(option);
            }
        });
    }
    
    loadDemoServices(country) {
        const demoServices = {
            'facebook': 'Facebook',
            'whatsapp': 'WhatsApp', 
            'telegram': 'Telegram',
            'google': 'Google',
            'twitter': 'Twitter',
            'instagram': 'Instagram'
        };
        
        const serviceSelect = document.getElementById('serviceSelect');
        serviceSelect.innerHTML = '<option value="">Select Service</option>';
        
        Object.keys(demoServices).forEach(service => {
            const option = document.createElement('option');
            option.value = service;
            option.textContent = demoServices[service];
            serviceSelect.appendChild(option);
        });
    }
    
    async loadOperators(country) {
        try {
            const response = await this.makeRequest(`guest/prices?country=${country}`);
            this.populateOperators(response, country);
        } catch (error) {
            console.error('Error loading operators:', error);
        }
    }
    
    populateOperators(pricesData, country) {
        const operatorSelect = document.getElementById('operatorSelect');
        operatorSelect.innerHTML = '<option value="any">Any Operator</option>';
        
        if (pricesData[country]) {
            const firstService = Object.keys(pricesData[country])[0];
            if (firstService && pricesData[country][firstService]) {
                Object.keys(pricesData[country][firstService]).forEach(operator => {
                    const option = document.createElement('option');
                    option.value = operator;
                    option.textContent = this.formatOperatorName(operator);
                    operatorSelect.appendChild(option);
                });
            }
        }
    }
    
    async onServiceChange(service) {
        const country = document.getElementById('countrySelect').value;
        if (!country || !service) {
            this.hidePrice();
            return;
        }
        
        try {
            const price = await this.getServicePrice(country, service);
            this.showPrice(price);
        } catch (error) {
            console.error('Error getting price:', error);
            this.showDemoPrice();
        }
    }
    
    async getServicePrice(country, service) {
        const operator = document.getElementById('operatorSelect').value;
        let endpoint = `guest/prices?country=${country}&product=${service}`;
        
        const response = await this.makeRequest(endpoint);
        
        if (response[country] && response[country][service]) {
            const operators = response[country][service];
            
            if (operator !== 'any' && operators[operator]) {
                return operators[operator].cost;
            }
            
            // Get the first available operator's price
            const firstOperator = Object.keys(operators)[0];
            return operators[firstOperator]?.cost || 1;
        }
        
        return 1; // Default price
    }
    
    showPrice(originalPrice) {
        const ourPrice = this.calculateOurPrice(originalPrice);
        document.getElementById('estimatedPrice').textContent = ourPrice;
        document.getElementById('priceInfo').classList.remove('hidden');
        
        // Enable buy button if balance is sufficient
        const buyButton = document.getElementById('buyButton');
        buyButton.disabled = ourPrice > this.userBalance;
        buyButton.textContent = ourPrice > this.userBalance ? 'Insufficient Balance' : 'Buy Number';
    }
    
    hidePrice() {
        document.getElementById('priceInfo').classList.add('hidden');
        document.getElementById('buyButton').disabled = true;
    }
    
    showDemoPrice() {
        const demoPrice = Math.floor(Math.random() * 20) + 10; // ₹10-30
        this.showPrice(demoPrice / 83); // Convert to USD for calculation
    }
    
    calculateOurPrice(originalPriceUSD) {
        // Convert USD to INR and apply markup
        const usdToInr = 83;
        const priceInr = originalPriceUSD * usdToInr;
        return Math.ceil(priceInr * this.priceMultiplier);
    }
    
    async buyNumber() {
        const country = document.getElementById('countrySelect').value;
        const service = document.getElementById('serviceSelect').value;
        const operator = document.getElementById('operatorSelect').value;
        
        if (!country || !service) {
            alert('Please select country and service');
            return;
        }
        
        const buyButton = document.getElementById('buyButton');
        buyButton.disabled = true;
        buyButton.textContent = 'Buying Number...';
        
        try {
            const finalOperator = operator === 'any' ? 'any' : operator;
            const order = await this.placeOrder(country, finalOperator, service);
            
            // Deduct balance
            const originalPrice = await this.getServicePrice(country, service);
            const ourPrice = this.calculateOurPrice(originalPrice);
            this.userBalance -= ourPrice;
            this.updateBalanceDisplay();
            
            this.currentOrder = order;
            this.showOrderStatus();
            this.startSMSPolling();
            
        } catch (error) {
            console.error('Error buying number:', error);
            alert('Failed to buy number: ' + (error.message || 'Service unavailable'));
        } finally {
            buyButton.disabled = false;
            buyButton.textContent = 'Buy Number';
        }
    }
    
    async placeOrder(country, operator, product) {
        const endpoint = `user/buy/activation/${country}/${operator}/${product}`;
        return await this.makeRequest(endpoint, 'GET', true);
    }
    
    showOrderStatus() {
        document.getElementById('currentNumber').textContent = this.currentOrder.phone;
        document.getElementById('orderService').textContent = `Service: ${this.formatServiceName(this.currentOrder.product)}`;
        document.getElementById('orderCountry').textContent = `Country: ${this.formatCountryName(this.currentOrder.country)}`;
        document.getElementById('orderStatus').classList.remove('hidden');
        
        // Scroll to order status
        document.getElementById('orderStatus').scrollIntoView({ behavior: 'smooth' });
    }
    
    startSMSPolling() {
        this.pollInterval = setInterval(async () => {
            await this.checkSMS();
        }, 5000); // Check every 5 seconds
    }
    
    async checkSMS() {
        if (!this.currentOrder) return;
        
        try {
            const orderInfo = await this.makeRequest(`user/check/${this.currentOrder.id}`, 'GET', true);
            
            if (orderInfo.sms && orderInfo.sms.length > 0) {
                const latestSMS = orderInfo.sms[orderInfo.sms.length - 1];
                this.displaySMS(latestSMS);
                clearInterval(this.pollInterval);
            }
        } catch (error) {
            console.error('Error checking SMS:', error);
        }
    }
    
    displaySMS(sms) {
        const smsInbox = document.getElementById('smsInbox');
        smsInbox.innerHTML = `
            <div class="success">✅ SMS Received!</div>
            <div><strong>From:</strong> ${sms.sender || 'Unknown'}</div>
            <div><strong>Text:</strong> ${sms.text}</div>
            ${sms.code ? `<div><strong>Code:</strong> ${sms.code}</div>` : ''}
            <div><small>Received at: ${new Date(sms.created_at).toLocaleTimeString()}</small></div>
        `;
    }
    
    closeOrder() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
        this.currentOrder = null;
        document.getElementById('orderStatus').classList.add('hidden');
    }
    
    updateBalanceDisplay() {
        document.getElementById('userBalance').textContent = this.userBalance.toFixed(2);
    }
    
    async makeRequest(endpoint, method = 'GET', auth = false) {
        // Use proxy to avoid CORS issues
        const url = '/api/' + endpoint;
        
        const headers = {
            'Accept': 'application/json'
        };
        
        try {
            const response = await fetch(url, {
                method: method,
                headers: headers
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`API Request failed for ${endpoint}:`, error);
            throw error;
        }
    }
    
    formatCountryName(country) {
        return country.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
    
    formatServiceName(service) {
        return service.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
    
    formatOperatorName(operator) {
        return operator.charAt(0).toUpperCase() + operator.slice(1);
    }
    
    showError(message) {
        const smsInbox = document.getElementById('smsInbox');
        if (smsInbox) {
            smsInbox.innerHTML = `<div class="error">${message}</div>`;
        }
    }
}

// Initialize service when page loads
let otpService;
document.addEventListener('DOMContentLoaded', () => {
    otpService = new OTPService();
});

// Global functions for HTML onclick
function buyNumber() {
    if (otpService) {
        otpService.buyNumber();
    }
}

function closeOrder() {
    if (otpService) {
        otpService.closeOrder();
    }
}
