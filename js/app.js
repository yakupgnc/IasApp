// Main Application
const App = {
    currentTab: 'dashboard',

    // Initialize app
    init() {
        Auth.init();
        this.bindEvents();
        this.setCurrentDate();
    },

    // Handle auth state changes
    handleAuthStateChange(isLoggedIn) {
        const loadingScreen = document.getElementById('loading-screen');
        const authScreen = document.getElementById('auth-screen');
        const houseSetupScreen = document.getElementById('house-setup-screen');
        const appScreen = document.getElementById('app-screen');

        loadingScreen.style.display = 'none';

        if (!isLoggedIn) {
            authScreen.style.display = 'block';
            houseSetupScreen.style.display = 'none';
            appScreen.style.display = 'none';
            return;
        }

        if (!Auth.userData.houseId) {
            authScreen.style.display = 'none';
            houseSetupScreen.style.display = 'block';
            appScreen.style.display = 'none';
            return;
        }

        authScreen.style.display = 'none';
        houseSetupScreen.style.display = 'none';
        appScreen.style.display = 'flex';

        this.loadAppData();
    },

    // Load app data
    loadAppData() {
        const houseId = Auth.userData.houseId;

        // Subscribe to house
        House.subscribeToHouse(houseId, (house) => {
            this.updateHouseUI(house);
        });

        // Subscribe to members
        House.subscribeToMembers(houseId, (members) => {
            this.updateMembersUI(members);
        });

        // Subscribe to expenses
        Expenses.subscribeToExpenses(houseId, (expenses) => {
            this.updateExpensesUI(expenses);
        });

        // Subscribe to shopping list
        Shopping.subscribeToShoppingList(houseId, (items) => {
            this.updateShoppingUI(items);
        });

        // Load past items for suggestions
        Shopping.loadPastItems(houseId);

        // Load past month archives
        this.loadArchivesUI(houseId);

        // Update profile UI
        this.updateProfileUI();
    },

    // Load Archives UI
    async loadArchivesUI(houseId) {
        const archives = await Calculate.getArchives(houseId);
        const list = document.getElementById('archives-list');

        if (!list) return;

        if (archives.length === 0) {
            list.innerHTML = '<p class="empty-state">Henüz geçmiş dönem yok</p>';
            return;
        }

        const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

        list.innerHTML = archives.map(arch => {
            // arch.month is like "2024-03"
            const parts = arch.month ? arch.month.split('-') : [];
            let displayMonth = arch.month;
            if (parts.length === 2) {
                const year = parts[0];
                const mIndex = parseInt(parts[1], 10) - 1;
                if (mIndex >= 0 && mIndex < 12) {
                    displayMonth = `${monthNames[mIndex]} ${year}`;
                }
            }

            return `
                <div class="expense-item">
                    <div class="expense-icon">📅</div>
                    <div class="expense-details">
                        <div class="expense-description">${displayMonth} Dönemi</div>
                        <div class="expense-meta">
                            <span>Sıfırlanma: ${arch.archivedAt ? arch.archivedAt.toDate().toLocaleDateString('tr-TR') : 'Bilinmiyor'}</span>
                        </div>
                    </div>
                    <div class="expense-right">
                        <span class="expense-amount">${(arch.total || 0).toFixed(2)}€</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    // Set current date
    setCurrentDate() {
        const now = new Date();
        const monthLabel = document.getElementById('current-month');
        if (monthLabel) {
            monthLabel.textContent = `Mevcut Dönem`;
        }

        // Set default date for expense form
        const expenseDate = document.getElementById('expense-date');
        if (expenseDate) {
            expenseDate.value = now.toISOString().split('T')[0];
        }
    },

    // Bind all events
    bindEvents() {
        // Auth tabs
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.handleAuthTabSwitch(e));
        });

        // Login form
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));

        // Register form
        document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));

        // Forgot password
        document.getElementById('forgot-password-btn').addEventListener('click', () => this.handleForgotPassword());

        // House setup
        document.getElementById('create-house-option').addEventListener('click', () => this.showCreateHouseForm());
        document.getElementById('join-house-option').addEventListener('click', () => this.showJoinHouseForm());
        document.getElementById('cancel-create').addEventListener('click', () => this.hideHouseForms());
        document.getElementById('cancel-join').addEventListener('click', () => this.hideHouseForms());
        document.getElementById('confirm-create').addEventListener('click', () => this.handleCreateHouse());
        document.getElementById('confirm-join').addEventListener('click', () => this.handleJoinHouse());

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Expenses
        document.getElementById('add-expense-btn').addEventListener('click', () => this.showExpenseModal());
        document.getElementById('close-expense-modal').addEventListener('click', () => this.hideExpenseModal());
        document.getElementById('cancel-expense').addEventListener('click', () => this.hideExpenseModal());
        document.getElementById('expense-form').addEventListener('submit', (e) => this.handleAddExpense(e));
        document.getElementById('see-all-expenses').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchTab('expenses');
        });

        // Receipt preview
        document.getElementById('expense-receipt').addEventListener('change', (e) => this.handleReceiptPreview(e));
        document.getElementById('remove-receipt').addEventListener('click', () => this.removeReceiptPreview());

        // Receipt modal
        document.getElementById('close-receipt-modal').addEventListener('click', () => this.hideReceiptModal());

        // Shopping list
        document.getElementById('add-item-btn').addEventListener('click', () => this.handleAddItem());
        document.getElementById('new-item-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleAddItem();
        });
        document.getElementById('new-item-input').addEventListener('input', (e) => this.handleItemInput(e));
        document.getElementById('clear-completed').addEventListener('click', () => this.handleClearCompleted());

        // Month filter
        document.getElementById('expense-month-filter').addEventListener('change', (e) => this.filterExpensesByMonth(e));

        // Calculate
        document.getElementById('reset-month-btn').addEventListener('click', () => this.handleResetMonth());

        // Settings
        document.getElementById('save-profile-btn').addEventListener('click', () => this.handleSaveProfile());
        document.getElementById('avatar-upload').addEventListener('change', (e) => this.handleAvatarUpload(e));
        document.getElementById('copy-invite-btn').addEventListener('click', () => this.handleCopyInviteCode());
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());
        document.getElementById('leave-house-btn').addEventListener('click', () => this.handleLeaveHouse());
        document.getElementById('profile-btn').addEventListener('click', () => this.switchTab('settings'));

        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('change', (e) => this.handleThemeToggle(e));
        this.loadTheme();

        // Modal overlays
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', () => {
                this.hideExpenseModal();
                this.hideReceiptModal();
            });
        });

        // Close suggestions on click outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.add-item-container')) {
                document.getElementById('item-suggestions').style.display = 'none';
            }
        });
    },

    // Auth tab switch
    handleAuthTabSwitch(e) {
        const tab = e.target.dataset.tab;
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');

        document.getElementById('login-form').style.display = tab === 'login' ? 'flex' : 'none';
        document.getElementById('register-form').style.display = tab === 'register' ? 'flex' : 'none';
        document.getElementById('auth-error').style.display = 'none';
    },

    // Handle login
    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const result = await Auth.login(email, password);
        if (!result.success) {
            this.showAuthError(result.error);
        }
    },

    // Handle register
    async handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        const result = await Auth.register(email, password, name);
        if (!result.success) {
            this.showAuthError(result.error);
        }
    },

    // Handle forgot password
    async handleForgotPassword() {
        const email = document.getElementById('login-email').value;
        if (!email) {
            this.showAuthError('Lütfen email adresinizi girin.');
            return;
        }

        const result = await Auth.resetPassword(email);
        if (result.success) {
            this.showToast('Şifre sıfırlama linki gönderildi!', 'success');
        } else {
            this.showAuthError(result.error);
        }
    },

    // Show auth error
    showAuthError(message) {
        const errorEl = document.getElementById('auth-error');
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    },

    // House setup forms
    showCreateHouseForm() {
        document.querySelector('.setup-options').style.display = 'none';
        document.getElementById('create-house-form').style.display = 'block';
    },

    showJoinHouseForm() {
        document.querySelector('.setup-options').style.display = 'none';
        document.getElementById('join-house-form').style.display = 'block';
    },

    hideHouseForms() {
        document.querySelector('.setup-options').style.display = 'grid';
        document.getElementById('create-house-form').style.display = 'none';
        document.getElementById('join-house-form').style.display = 'none';
        document.getElementById('setup-error').style.display = 'none';
    },

    // Handle create house
    async handleCreateHouse() {
        const name = document.getElementById('house-name').value;
        const budget = document.getElementById('monthly-budget').value;
        const members = document.getElementById('member-count').value;

        if (!name || !budget || !members) {
            this.showSetupError('Tüm alanları doldurun.');
            return;
        }

        const result = await House.createHouse(name, budget, members);
        if (result.success) {
            this.handleAuthStateChange(true);
        } else {
            this.showSetupError(result.error);
        }
    },

    // Handle join house
    async handleJoinHouse() {
        const code = document.getElementById('invite-code').value.toUpperCase();

        if (!code || code.length !== 6) {
            this.showSetupError('6 karakterli davet kodunu girin.');
            return;
        }

        const result = await House.joinHouse(code);
        if (result.success) {
            this.handleAuthStateChange(true);
        } else {
            this.showSetupError(result.error);
        }
    },

    showSetupError(message) {
        const errorEl = document.getElementById('setup-error');
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    },

    // Navigation
    handleNavigation(e) {
        const tab = e.currentTarget.dataset.tab;
        this.switchTab(tab);
    },

    switchTab(tab) {
        this.currentTab = tab;

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tab);
        });

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tab}`);
        });

        // Update calculate page when switching to it
        if (tab === 'calculate') {
            this.updateCalculateUI();
        }
    },

    // Update house UI
    updateHouseUI(house) {
        document.getElementById('header-house-name').textContent = house.name;
        document.getElementById('budget-limit').textContent = House.getTotalBudget();
        document.getElementById('settings-house-name').textContent = house.name;
        document.getElementById('settings-budget').textContent = `${house.monthlyBudget}€`;
        document.getElementById('settings-members').textContent = house.memberCount;
        document.getElementById('settings-invite-code').textContent = house.inviteCode;
    },

    // Update members UI
    updateMembersUI(members) {
        const membersList = document.getElementById('settings-members-list');
        membersList.innerHTML = members.map(member => `
            <div class="member-manage-item">
                <img src="${member.photoURL || Auth.getDefaultAvatar()}" alt="${member.displayName}" class="member-manage-avatar">
                <div class="member-manage-info">
                    <div class="member-manage-name">${member.displayName}</div>
                    <div class="member-manage-role">${member.role === 'admin' ? 'Yönetici' : 'Üye'}</div>
                </div>
            </div>
        `).join('');
    },

    // Update expenses UI
    updateExpensesUI(expenses) {
        const currentMonthExpenses = Expenses.getCurrentMonthExpenses();
        const total = Expenses.getCurrentMonthTotal();
        const budget = House.getTotalBudget();
        const percentage = budget > 0 ? Math.min((total / budget) * 100, 100) : 0;

        // Update budget display
        document.getElementById('total-spent').textContent = total.toFixed(2);
        document.getElementById('budget-progress-fill').style.width = `${percentage}%`;
        document.getElementById('budget-progress-text').textContent = `${Math.round(percentage)}%`;

        // Update progress bar color and warning
        const progressFill = document.getElementById('budget-progress-fill');
        const warning = document.getElementById('budget-warning');
        progressFill.classList.remove('warning', 'danger');
        warning.style.display = 'none';

        if (percentage >= 100) {
            progressFill.classList.add('danger');
            warning.className = 'budget-warning danger';
            warning.textContent = '⚠️ Bütçe aşıldı!';
            warning.style.display = 'block';
        } else if (percentage >= 80) {
            progressFill.classList.add('warning');
            warning.className = 'budget-warning warning';
            warning.textContent = `⚠️ Bütçenin %${Math.round(percentage)}'ine ulaştınız!`;
            warning.style.display = 'block';
        }

        // Update debt summary on dashboard
        this.updateDashboardDebts();

        // Update member spending
        this.updateMemberSpending();

        // Update recent expenses
        this.updateRecentExpenses(currentMonthExpenses.slice(0, 5));

        // Update full expense list
        this.updateFullExpenseList();

        // Update month filter
        this.updateMonthFilter();
    },

    // Update dashboard debts
    updateDashboardDebts() {
        const debtList = document.getElementById('debt-list');
        const result = Calculate.calculateDebts(House.members, Expenses.getCurrentMonthExpenses());

        if (result.transfers.length === 0) {
            debtList.innerHTML = '<p class="empty-state">Herkes eşit! 🎉</p>';
            return;
        }

        debtList.innerHTML = result.transfers.map(t => `
            <div class="debt-item">
                <span class="debt-from">${t.from}</span>
                <span class="debt-arrow">→</span>
                <span class="debt-to">${t.to}</span>
                <span class="debt-amount">${t.amount.toFixed(2)}€</span>
            </div>
        `).join('');
    },

    // Update member spending display
    updateMemberSpending() {
        const list = document.getElementById('members-spending-list');
        const spending = Expenses.getSpendingByMember();
        const maxSpent = Math.max(...spending.map(s => s.total), 1);

        if (spending.length === 0) {
            list.innerHTML = '<p class="empty-state">Henüz harcama yok</p>';
            return;
        }

        // Add members who haven't spent anything
        const allMembers = House.members.map(m => {
            const memberSpending = spending.find(s => s.userId === m.id);
            return {
                userId: m.id,
                name: m.displayName,
                photoURL: m.photoURL,
                total: memberSpending ? memberSpending.total : 0
            };
        }).sort((a, b) => b.total - a.total);

        list.innerHTML = allMembers.map(member => `
            <div class="member-spending-item">
                <img src="${member.photoURL || Auth.getDefaultAvatar()}" alt="${member.name}" class="member-avatar">
                <div class="member-info">
                    <div class="member-name">${member.name}</div>
                    <div class="member-bar">
                        <div class="member-bar-fill" style="width: ${(member.total / maxSpent) * 100}%"></div>
                    </div>
                </div>
                <span class="member-amount">${member.total.toFixed(2)}€</span>
            </div>
        `).join('');
    },

    // Update recent expenses
    updateRecentExpenses(expenses) {
        const list = document.getElementById('recent-expenses');

        if (expenses.length === 0) {
            list.innerHTML = '<p class="empty-state">Henüz harcama yok</p>';
            return;
        }

        list.innerHTML = expenses.map(exp => this.createExpenseItem(exp)).join('');
        this.bindExpenseClicks(list);
    },

    // Update full expense list
    updateFullExpenseList() {
        const filter = document.getElementById('expense-month-filter');
        const selectedValue = filter.value;

        let expenses;
        if (selectedValue) {
            const [year, month] = selectedValue.split('-').map(Number);
            expenses = Expenses.getExpensesByMonth(year, month);
        } else {
            expenses = Expenses.getCurrentMonthExpenses();
        }

        const list = document.getElementById('all-expenses');

        if (expenses.length === 0) {
            list.innerHTML = '<p class="empty-state">Bu dönemde harcama yok</p>';
            return;
        }

        list.innerHTML = expenses.map(exp => this.createExpenseItem(exp)).join('');
        this.bindExpenseClicks(list);
    },

    // Create expense item HTML
    createExpenseItem(exp) {
        const isOwner = exp.addedBy === Auth.currentUser.uid;
        const memberCount = House.members.length || 1;
        const sharePerPerson = exp.amount / memberCount;

        // Calculate what this expense means for current user
        let userImpact = '';
        let impactClass = '';
        if (isOwner) {
            // Owner paid, so they are owed money
            const owedAmount = exp.amount - sharePerPerson;
            if (owedAmount > 0.01) {
                userImpact = `+${owedAmount.toFixed(2)}€`;
                impactClass = 'impact-positive';
            }
        } else {
            // Others owe their share
            userImpact = `-${sharePerPerson.toFixed(2)}€`;
            impactClass = 'impact-negative';
        }

        return `
            <div class="expense-item" data-id="${exp.id}" data-receipt="${exp.receiptURL || ''}" data-owner="${exp.addedBy}">
                <div class="expense-icon ${exp.receiptURL ? 'has-receipt' : ''}">
                    ${exp.receiptURL ? '🧾' : '💸'}
                </div>
                <div class="expense-details">
                    <div class="expense-description">${exp.description}</div>
                    <div class="expense-meta">
                        <span>${exp.addedByName}</span>
                        <span>•</span>
                        <span>${Expenses.formatDate(exp.date)}</span>
                    </div>
                </div>
                <div class="expense-right">
                    <span class="expense-amount">${exp.amount.toFixed(2)}€</span>
                    <span class="expense-impact ${impactClass}">${userImpact}</span>
                </div>
                ${isOwner ? `<button class="expense-delete-btn" data-id="${exp.id}" title="Sil">🗑️</button>` : ''}
            </div>
        `;
    },

    // Bind expense click events
    bindExpenseClicks(container) {
        container.querySelectorAll('.expense-item').forEach(item => {
            // Delete button click
            const deleteBtn = item.querySelector('.expense-delete-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await this.handleDeleteExpense(deleteBtn.dataset.id);
                });
            }

            // Receipt view on click
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('expense-delete-btn')) return;
                const receiptURL = item.dataset.receipt;
                if (receiptURL) {
                    this.showReceiptModal(receiptURL);
                }
            });
        });
    },

    // Handle delete expense
    async handleDeleteExpense(expenseId) {
        const confirmed = await this.showConfirm(
            'Harcamayı Sil',
            'Bu harcamayı silmek istediğinize emin misiniz?',
            '🗑️'
        );

        if (!confirmed) return;

        const result = await Expenses.deleteExpense(Auth.userData.houseId, expenseId);
        if (result.success) {
            this.showToast('Harcama silindi', 'success');
        } else {
            this.showToast(result.error, 'error');
        }
    },

    // Update month filter
    updateMonthFilter() {
        const filter = document.getElementById('expense-month-filter');
        const months = Expenses.getAvailableMonths();
        const currentValue = filter.value;

        filter.innerHTML = months.map((m, i) =>
            `<option value="${m.year}-${m.month}" ${i === 0 ? 'selected' : ''}>${m.label}</option>`
        ).join('');

        if (currentValue && months.some(m => `${m.year}-${m.month}` === currentValue)) {
            filter.value = currentValue;
        }
    },

    filterExpensesByMonth() {
        this.updateFullExpenseList();
    },

    // Expense modal
    showExpenseModal() {
        document.getElementById('expense-modal').style.display = 'flex';
        document.getElementById('expense-form').reset();
        this.setCurrentDate();
        this.removeReceiptPreview();
    },

    hideExpenseModal() {
        document.getElementById('expense-modal').style.display = 'none';
    },

    // Handle add expense
    async handleAddExpense(e) {
        e.preventDefault();

        // Prevent double submission
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn.disabled) return;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Kaydediliyor...';

        const description = document.getElementById('expense-description').value;
        const amount = document.getElementById('expense-amount').value;
        const date = document.getElementById('expense-date').value;
        const receiptFile = document.getElementById('expense-receipt').files[0];

        const result = await Expenses.addExpense(
            Auth.userData.houseId,
            description,
            amount,
            date,
            receiptFile
        );

        submitBtn.disabled = false;
        submitBtn.textContent = 'Kaydet';

        if (result.success) {
            this.hideExpenseModal();
            this.showToast('Harcama eklendi!', 'success');
        } else {
            this.showToast(result.error, 'error');
        }
    },

    // Receipt preview
    handleReceiptPreview(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('receipt-preview-img').src = e.target.result;
                document.getElementById('receipt-preview').style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    },

    removeReceiptPreview() {
        document.getElementById('expense-receipt').value = '';
        document.getElementById('receipt-preview').style.display = 'none';
    },

    // Receipt modal
    showReceiptModal(url) {
        document.getElementById('receipt-view-img').src = url;
        document.getElementById('receipt-modal').style.display = 'flex';
    },

    hideReceiptModal() {
        document.getElementById('receipt-modal').style.display = 'none';
    },

    // Shopping list
    updateShoppingUI(items) {
        const activeItems = Shopping.getActiveItems();
        const completedItems = Shopping.getCompletedItems();

        // Active items
        const activeList = document.getElementById('shopping-list');
        if (activeItems.length === 0) {
            activeList.innerHTML = '<p class="empty-state">Alışveriş listesi boş</p>';
        } else {
            activeList.innerHTML = activeItems.map(item => this.createShoppingItem(item)).join('');
            this.bindShoppingItemEvents(activeList);
        }

        // Completed items
        const completedSection = document.getElementById('completed-section');
        const completedList = document.getElementById('completed-list');

        if (completedItems.length > 0) {
            completedSection.style.display = 'block';
            completedList.innerHTML = completedItems.map(item => this.createShoppingItem(item)).join('');
            this.bindShoppingItemEvents(completedList);
        } else {
            completedSection.style.display = 'none';
        }
    },

    createShoppingItem(item) {
        return `
            <div class="shopping-item ${item.completed ? 'completed' : ''}" data-id="${item.id}" data-completed="${item.completed}">
                <div class="item-checkbox"></div>
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-added-by">${item.addedByName}</div>
                </div>
                <button class="item-delete" data-id="${item.id}">🗑️</button>
            </div>
        `;
    },

    bindShoppingItemEvents(container) {
        container.querySelectorAll('.shopping-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                if (e.target.classList.contains('item-delete')) {
                    await Shopping.deleteItem(Auth.userData.houseId, e.target.dataset.id);
                    this.showToast('Ürün silindi', 'info');
                } else {
                    const id = item.dataset.id;
                    const completed = item.dataset.completed === 'true';
                    await Shopping.toggleItem(Auth.userData.houseId, id, completed);
                }
            });
        });
    },

    // Handle item input for suggestions
    handleItemInput(e) {
        const input = e.target.value;
        const suggestions = Shopping.getSuggestions(input);
        const container = document.getElementById('item-suggestions');

        if (suggestions.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.innerHTML = suggestions.map(s => `
            <div class="suggestion-item" data-name="${s.name}">
                <span class="suggestion-icon">🕐</span>
                <span>${s.name}</span>
            </div>
        `).join('');
        container.style.display = 'block';

        // Bind suggestion clicks
        container.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                document.getElementById('new-item-input').value = item.dataset.name;
                container.style.display = 'none';
                this.handleAddItem();
            });
        });
    },

    async handleAddItem() {
        const input = document.getElementById('new-item-input');
        const name = input.value.trim();

        if (!name) return;

        const result = await Shopping.addItem(Auth.userData.houseId, name);
        if (result.success) {
            input.value = '';
            document.getElementById('item-suggestions').style.display = 'none';
        } else {
            this.showToast(result.error, 'error');
        }
    },

    async handleClearCompleted() {
        const result = await Shopping.clearCompleted(Auth.userData.houseId);
        if (result.success) {
            this.showToast('Tamamlananlar temizlendi', 'info');
        }
    },

    // Calculate page
    updateCalculateUI() {
        const result = Calculate.calculateDebts(House.members, Expenses.getCurrentMonthExpenses());

        document.getElementById('calc-total').textContent = `${result.total.toFixed(2)}€`;
        document.getElementById('calc-per-person').textContent = `${result.perPerson.toFixed(2)}€`;

        // Breakdown
        const breakdownList = document.getElementById('calc-breakdown');
        if (result.breakdown.length === 0) {
            breakdownList.innerHTML = '<p class="empty-state">Henüz harcama yok</p>';
        } else {
            breakdownList.innerHTML = result.breakdown.map(m => {
                const statusClass = m.diff > 0 ? 'positive' : m.diff < 0 ? 'negative' : '';
                const statusText = m.diff > 0 ? `+${m.diff.toFixed(2)}€ alacaklı` :
                    m.diff < 0 ? `${m.diff.toFixed(2)}€ borçlu` : 'Eşit';
                return `
                    <div class="breakdown-item">
                        <img src="${m.photoURL || Auth.getDefaultAvatar()}" alt="${m.name}" class="breakdown-avatar">
                        <div class="breakdown-info">
                            <div class="breakdown-name">${m.name}</div>
                            <div class="breakdown-spent">Harcadı: ${m.spent.toFixed(2)}€</div>
                        </div>
                        <span class="breakdown-status ${statusClass}">${statusText}</span>
                    </div>
                `;
            }).join('');
        }

        // Transfers
        const transfersList = document.getElementById('calc-transfers');
        if (result.transfers.length === 0) {
            transfersList.innerHTML = '<p class="empty-state">Transfer gerekmiyor 🎉</p>';
        } else {
            transfersList.innerHTML = result.transfers.map(t => `
                <div class="transfer-item">
                    <span class="transfer-from">${t.from}</span>
                    <span class="transfer-arrow">→</span>
                    <span class="transfer-to">${t.to}</span>
                    <span class="transfer-amount">${t.amount.toFixed(2)}€</span>
                </div>
            `).join('');
        }
    },

    async handleResetMonth() {
        const confirmed = await this.showConfirm(
            'Yeni Aya Geç',
            'Bu ay tüm harcamalar silinecek ve arşivlenecek. Devam etmek istiyor musunuz?',
            '🔄'
        );

        if (!confirmed) return;

        const result = Calculate.calculateDebts(House.members, Expenses.getCurrentMonthExpenses());
        const archiveResult = await Calculate.archiveAndReset(
            Auth.userData.houseId,
            result.total,
            result.breakdown,
            result.transfers
        );

        if (archiveResult.success) {
            this.showToast('Ay sıfırlandı! Yeni aya başladınız.', 'success');
        } else {
            this.showToast(archiveResult.error, 'error');
        }
    },

    // Settings
    updateProfileUI() {
        const avatar = Auth.userData.photoURL || Auth.getDefaultAvatar();
        document.getElementById('header-avatar').src = avatar;
        document.getElementById('settings-avatar').src = avatar;
        document.getElementById('settings-name').value = Auth.userData.displayName || '';
        document.getElementById('settings-email').value = Auth.userData.email || '';
    },

    async handleSaveProfile() {
        const name = document.getElementById('settings-name').value;

        if (!name.trim()) {
            this.showToast('İsim boş olamaz', 'error');
            return;
        }

        const result = await Auth.updateProfile(name);
        if (result.success) {
            this.showToast('Profil güncellendi!', 'success');
            this.updateProfileUI();

            // Update member info in house
            await db.collection('houses').doc(Auth.userData.houseId)
                .collection('members').doc(Auth.currentUser.uid)
                .update({ displayName: name });
        } else {
            this.showToast(result.error, 'error');
        }
    },

    async handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        this.showToast('Fotoğraf yükleniyor...', 'info');

        const result = await Auth.uploadProfilePhoto(file);
        if (result.success) {
            this.updateProfileUI();

            // Update member photo in house
            await db.collection('houses').doc(Auth.userData.houseId)
                .collection('members').doc(Auth.currentUser.uid)
                .update({ photoURL: result.photoURL });

            this.showToast('Fotoğraf güncellendi!', 'success');
        } else {
            this.showToast(result.error, 'error');
        }
    },

    handleCopyInviteCode() {
        const code = House.currentHouse.inviteCode;
        navigator.clipboard.writeText(code).then(() => {
            this.showToast('Davet kodu kopyalandı!', 'success');
        }).catch(() => {
            this.showToast(`Davet kodu: ${code}`, 'info');
        });
    },

    async handleLogout() {
        House.unsubscribe();
        Expenses.unsubscribeFromExpenses();
        Shopping.unsubscribeFromShoppingList();
        await Auth.logout();
    },

    async handleLeaveHouse() {
        // İlk onay
        const firstConfirm = await this.showConfirm(
            'Evden Ayrıl',
            'Evden ayrılmak istediğinize emin misiniz?',
            '🏠'
        );

        if (!firstConfirm) return;

        // İkinci onay
        const secondConfirm = await this.showConfirm(
            'Son Onay!',
            'Bu işlem geri alınamaz! Gerçekten evden ayrılmak istiyor musunuz?',
            '⚠️'
        );

        if (!secondConfirm) return;

        try {
            House.unsubscribe();
            Expenses.unsubscribeFromExpenses();
            Shopping.unsubscribeFromShoppingList();

            const result = await House.leaveHouse();
            if (result.success) {
                this.showToast('Evden ayrıldınız', 'success');
                // Çıkış yap - giriş sayfasına yönlendir
                await Auth.logout();
            } else {
                this.showToast(result.error, 'error');
            }
        } catch (error) {
            this.showToast('Bir hata oluştu: ' + error.message, 'error');
        }
    },

    // Toast notifications
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    },

    // Theme Management
    loadTheme() {
        const savedTheme = localStorage.getItem('iasapp-theme');
        const isDark = savedTheme === null || savedTheme === 'dark';

        document.body.classList.toggle('light-theme', !isDark);
        document.getElementById('theme-toggle').checked = isDark;
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) metaTheme.setAttribute('content', isDark ? '#090d16' : '#f4f6fb');
    },

    handleThemeToggle(e) {
        const isDark = e.target.checked;
        document.body.classList.toggle('light-theme', !isDark);
        localStorage.setItem('iasapp-theme', isDark ? 'dark' : 'light');
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) metaTheme.setAttribute('content', isDark ? '#090d16' : '#f4f6fb');
        this.showToast(isDark ? 'Karanlık tema aktif' : 'Açık tema aktif', 'info');
    },

    // Custom Confirm Modal
    showConfirm(title, message, icon = '⚠️') {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirm-modal');
            document.getElementById('confirm-title').textContent = title;
            document.getElementById('confirm-message').textContent = message;
            document.getElementById('confirm-icon').textContent = icon;

            modal.style.display = 'flex';

            const okBtn = document.getElementById('confirm-ok');
            const cancelBtn = document.getElementById('confirm-cancel');
            const overlay = modal.querySelector('.modal-overlay');

            const cleanup = () => {
                modal.style.display = 'none';
                okBtn.removeEventListener('click', onOk);
                cancelBtn.removeEventListener('click', onCancel);
                overlay.removeEventListener('click', onCancel);
            };

            const onOk = () => {
                cleanup();
                resolve(true);
            };

            const onCancel = () => {
                cleanup();
                resolve(false);
            };

            okBtn.addEventListener('click', onOk);
            cancelBtn.addEventListener('click', onCancel);
            overlay.addEventListener('click', onCancel);
        });
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
