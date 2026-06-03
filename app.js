/**
 * ==========================================================================
 * FEEPAYR APP STATE & CONTROLLERS (VANILLA JAVASCRIPT)
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================================================
    // MOCK DATA STORE
    // ==========================================================================
    
    // Initial Pending Fees (State: Pending payment)
    let pendingFees = [
        { id: 'fee_1', type: '2nd Year Fees', course: 'M.Sc. Computer Science', total: 44286, current: 44286 }
    ];

    // Historical Paid Receipts
    let receiptsList = [
        { receiptNo: 'FR/2026/1042', date: '12/10/2026', type: '2nd Year Fees', course: 'M.Sc. Computer Science', amount: 44286 }
    ];

    // Transaction Attempt Status Log
    let statusLog = [];

    // App state flags
    let isDemoModePending = true; // Show pending payment by default
    let selectedFees = [];

    // ==========================================================================
    // DOM ELEMENTS CACHE
    // ==========================================================================
    const tabCards = document.querySelectorAll('.tab-card');
    const tabContents = document.querySelectorAll('.tab-content');
    const demoEmptyBtn = document.getElementById('demoStateEmpty');
    const demoPendingBtn = document.getElementById('demoStatePending');
    const pendingFeesBody = document.getElementById('pendingFeesBody');
    const receiptsBody = document.getElementById('receiptsBody');
    const statusBody = document.getElementById('statusBody');
    const totalPayableSpan = document.getElementById('totalPayableAmount');
    const payNowBtn = document.getElementById('payNowBtn');
    const lastAttemptSpan = document.getElementById('lastAttemptTimeValue');
    const receiptSearchInput = document.getElementById('receiptSearch');

    // Modals
    const profileModal = document.getElementById('profileModal');
    const checkoutModal = document.getElementById('checkoutModal');
    const receiptModal = document.getElementById('receiptModal');
    const modalCloses = document.querySelectorAll('.modal-close');

    // Checkbox Empty State SVG string
    const emptyStateHTML = `
        <tr class="empty-row">
            <td colspan="6">
                <div class="empty-state-wrapper">
                    <div class="empty-illustration">
                        <svg viewBox="0 0 200 200" class="illustration-svg">
                            <circle cx="100" cy="100" r="90" fill="#f8fbf9"/>
                            <rect x="50" y="60" width="30" height="40" rx="3" fill="#eef4f2" stroke="#d5e5df" stroke-width="1.5"/>
                            <line x1="56" y1="70" x2="74" y2="70" stroke="#bbdad0" stroke-width="2"/>
                            <line x1="56" y1="78" x2="68" y2="78" stroke="#bbdad0" stroke-width="2"/>
                            <line x1="56" y1="86" x2="72" y2="86" stroke="#bbdad0" stroke-width="2"/>
                            <rect x="120" y="60" width="30" height="40" rx="3" fill="#eef4f2" stroke="#d5e5df" stroke-width="1.5"/>
                            <line x1="126" y1="70" x2="144" y2="70" stroke="#bbdad0" stroke-width="2"/>
                            <line x1="126" y1="78" x2="138" y2="78" stroke="#bbdad0" stroke-width="2"/>
                            <line x1="126" y1="86" x2="142" y2="86" stroke="#bbdad0" stroke-width="2"/>
                            <path d="M85,55 L115,55 L115,120 L85,120 Z" fill="#eef4f2" stroke="#bbdad0" stroke-width="2"/>
                            <polygon points="82,55 100,42 118,55" fill="#539D82"/>
                            <rect x="90" y="65" width="6" height="8" rx="1" fill="#fff" stroke="#bbdad0" stroke-width="1"/>
                            <rect x="104" y="65" width="6" height="8" rx="1" fill="#fff" stroke="#bbdad0" stroke-width="1"/>
                            <rect x="90" y="80" width="6" height="8" rx="1" fill="#fff" stroke="#bbdad0" stroke-width="1"/>
                            <rect x="104" y="80" width="6" height="8" rx="1" fill="#fff" stroke="#bbdad0" stroke-width="1"/>
                            <rect x="90" y="95" width="6" height="8" rx="1" fill="#fff" stroke="#bbdad0" stroke-width="1"/>
                            <rect x="104" y="95" width="6" height="8" rx="1" fill="#fff" stroke="#bbdad0" stroke-width="1"/>
                            <path d="M95,120 L95,110 L105,110 L105,120 Z" fill="#316150"/>
                            <circle cx="100" cy="85" r="30" fill="none" stroke="#717c78" stroke-width="4.5"/>
                            <line x1="121" y1="106" x2="145" y2="130" stroke="#717c78" stroke-width="6" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <p class="empty-message">Yeah! You have no upcoming payments.</p>
                </div>
            </td>
        </tr>
    `;

    // Set initial last attempt time on UI to match the failed/pending timestamp
    lastAttemptSpan.textContent = '--/--/---- --:--:-- --';

    // ==========================================================================
    // INITIALIZATION & TAB NAVIGATION
    // ==========================================================================
    
    // Tab switching
    tabCards.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            
            // Toggle active classes on tabs
            tabCards.forEach(tc => tc.classList.remove('active'));
            tab.classList.add('active');

            // Toggle active classes on content panels
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${targetTab}-tab`) {
                    content.classList.add('active');
                }
            });
        });
    });

    // Alert dismiss behavior
    document.querySelectorAll('.alert-close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const alertBox = e.target.closest('.alert-box');
            alertBox.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            alertBox.style.opacity = '0';
            alertBox.style.transform = 'translateY(-10px)';
            setTimeout(() => alertBox.remove(), 300);
        });
    });

    // ==========================================================================
    // DEMO CONTROLLER STATE HANDLERS
    // ==========================================================================
    demoEmptyBtn.addEventListener('click', () => {
        isDemoModePending = false;
        demoEmptyBtn.classList.add('active');
        demoPendingBtn.classList.remove('active');
        renderPendingFees();
    });

    demoPendingBtn.addEventListener('click', () => {
        isDemoModePending = true;
        demoPendingBtn.classList.add('active');
        demoEmptyBtn.classList.remove('active');
        renderPendingFees();
    });


    // ==========================================================================
    // DATA RENDERING CONTROLLERS
    // ==========================================================================

    // Format currency helper
    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(amount);
    }

    // 1. Render Pending Fees Table
    function renderPendingFees() {
        selectedFees = [];

        if (!isDemoModePending || pendingFees.length === 0) {
            pendingFeesBody.innerHTML = emptyStateHTML;
            updateTotalPayable();
            return;
        }

        // Single fee item — no checkboxes needed, auto-select it
        const fee = pendingFees[0];
        selectedFees = [fee];

        pendingFeesBody.innerHTML = `
            <tr id="row-${fee.id}">
                <td>
                    <label class="checkbox-container">
                        <input type="checkbox" class="fee-checkbox" data-id="${fee.id}" checked disabled>
                        <span class="checkmark"></span>
                    </label>
                </td>
                <td style="font-weight: 600;">${fee.type}</td>
                <td>${fee.course}</td>
                <td>${formatCurrency(fee.total)}</td>
                <td style="color: var(--color-danger); font-weight: 600;">${formatCurrency(fee.current)}</td>
                <td style="font-weight: 600;">${formatCurrency(fee.current)}</td>
            </tr>
        `;

        updateTotalPayable();
    }

    // Update total amount on bottom bar
    function updateTotalPayable() {
        if (selectedFees.length === 0) {
            totalPayableSpan.textContent = 'NA';
            payNowBtn.disabled = true;
        } else {
            const sum = selectedFees.reduce((acc, curr) => acc + curr.current, 0);
            totalPayableSpan.textContent = formatCurrency(sum);
            payNowBtn.disabled = false;
        }
    }

    // 2. Render Fees Receipt Table
    function renderReceipts(filter = '') {
        const query = filter.toLowerCase().trim();
        const filtered = receiptsList.filter(rec => 
            rec.receiptNo.toLowerCase().includes(query) || 
            rec.type.toLowerCase().includes(query)
        );

        if (filtered.length === 0) {
            receiptsBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: var(--color-text-muted);">
                        No receipts found matching "${filter}".
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        filtered.forEach(rec => {
            html += `
                <tr>
                    <td style="font-weight: 600; color: var(--color-primary-dark);">${rec.receiptNo}</td>
                    <td>${rec.date}</td>
                    <td style="font-weight: 500;">${rec.type}</td>
                    <td>${rec.course}</td>
                    <td style="font-weight: 600;">${formatCurrency(rec.amount)}</td>
                    <td>
                        <button class="download-action-btn" data-receipt="${rec.receiptNo}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            View & Print
                        </button>
                    </td>
                </tr>
            `;
        });
        receiptsBody.innerHTML = html;

        // Attach listeners for Print Receipt
        document.querySelectorAll('.download-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const recId = btn.getAttribute('data-receipt');
                const receipt = receiptsList.find(r => r.receiptNo === recId);
                if (receipt) openReceiptPrintModal(receipt);
            });
        });
    }

    // Receipt search handler
    receiptSearchInput.addEventListener('input', (e) => {
        renderReceipts(e.target.value);
    });

    // 3. Render Payment Status Table
    function renderPaymentStatus() {
        let html = '';
        statusLog.forEach(log => {
            let statusClass = 'pending';
            if (log.status === 'Success') statusClass = 'success';
            if (log.status === 'Failed') statusClass = 'failed';

            const actionCell = log.status === 'Pending' 
                ? `<button class="verify-action-btn" data-txnid="${log.txnId}">Verify Status</button>` 
                : `<span style="color: var(--color-text-muted); font-size: 11px;">Completed</span>`;

            html += `
                <tr>
                    <td style="font-weight: 600;">${log.txnId}</td>
                    <td>${log.datetime}</td>
                    <td>${log.type}</td>
                    <td style="font-weight: 600;">${formatCurrency(log.amount)}</td>
                    <td><span style="font-weight: 500;">${log.method}</span></td>
                    <td>
                        <span class="status-badge ${statusClass}">
                            <span class="status-dot"></span>
                            ${log.status}
                        </span>
                    </td>
                    <td>${actionCell}</td>
                </tr>
            `;
        });
        statusBody.innerHTML = html;

        // Attach listeners to verify status
        document.querySelectorAll('.verify-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const txnId = btn.getAttribute('data-txnid');
                handleVerifyStatus(txnId, btn);
            });
        });
    }

    // Verify transaction status animation & update
    function handleVerifyStatus(txnId, buttonEl) {
        buttonEl.disabled = true;
        buttonEl.innerHTML = `<span class="btn-spinner"></span> Verifying...`;
        
        // Simulating checking status against API
        setTimeout(() => {
            const txn = statusLog.find(t => t.txnId === txnId);
            if (txn) {
                txn.status = 'Success';
                
                // Add to receipts if it isn't already there
                const isAlreadyPaid = receiptsList.some(r => r.type === txn.type);
                if (!isAlreadyPaid) {
                    const today = new Date();
                    const receiptNo = `FR/2026/${Math.floor(1000 + Math.random() * 9000)}`;
                    receiptsList.unshift({
                        receiptNo: receiptNo,
                        date: formatDate(today),
                        type: txn.type,
                        course: 'M.Sc. Computer Science',
                        amount: txn.amount
                    });
                    
                    // Remove from pending list
                    pendingFees = pendingFees.filter(f => f.type !== txn.type);
                }

                // Render everything to reflect updates
                renderPaymentStatus();
                renderReceipts();
                renderPendingFees();
            }
        }, 1500);
    }


    // ==========================================================================
    // MODAL STATE MANAGEMENT
    // ==========================================================================

    // Opens a generic modal
    function openModal(modalEl) {
        modalEl.classList.add('active');
        document.body.style.overflow = 'hidden'; // Lock body scroll
    }

    // Closes a generic modal
    function closeModal(modalEl) {
        modalEl.classList.remove('active');
        document.body.style.overflow = ''; // Unlock body scroll
    }

    // Attach profile modal open trigger
    document.getElementById('avatarBtn').addEventListener('click', () => {
        openModal(profileModal);
    });

    // Close buttons handler
    modalCloses.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-close');
            const modal = document.getElementById(targetId);
            if (modal) closeModal(modal);
        });
    });

    // Click outside overlay to close modal
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeModal(e.target);
        }
    });

    // Footer Links Modals
    document.querySelectorAll('.footer-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const modalId = link.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            if (modal) openModal(modal);
        });
    });

    // Header Home/Logout mock actions
    document.getElementById('homeBtn').addEventListener('click', () => {
        // Reset navigation to Make Payment tab
        tabCards[0].click();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        alert('Interactive Simulation Logout!\nResetting dashboard state.');
        // Reset tables & settings
        isDemoModePending = false;
        demoEmptyBtn.click();
        pendingFees = [
            { id: 'fee_1', type: '2nd Year Fees', course: 'M.Sc. Computer Science', total: 44286, current: 44286 }
        ];
        receiptsList = [
            { receiptNo: 'FR/2026/1042', date: '12/10/2026', type: '2nd Year Fees', course: 'M.Sc. Computer Science', amount: 44286 }
        ];
        statusLog = [];
        lastAttemptSpan.textContent = '--/--/---- --:--:-- --';
        renderPendingFees();
        renderReceipts();
        renderPaymentStatus();
    });


    // ==========================================================================
    // CHECKOUT FLOW & PAYMENT PROCESSOR
    // ==========================================================================

    // Click "Pay Now" shows offline payment warning
    payNowBtn.addEventListener('click', () => {
        if (selectedFees.length === 0) return;

        // Show the "pay via offline" warning modal instead of checkout
        openModal(document.getElementById('offlinePaymentModal'));
    });

    // Checkout payment tabs controller
    const payTabBtns = document.querySelectorAll('.pay-tab-btn');
    const payMethodPanels = document.querySelectorAll('.pay-method-panel');

    payTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const method = btn.getAttribute('data-pay-method');
            
            payTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            payMethodPanels.forEach(panel => {
                panel.classList.remove('active');
                if (panel.id === `panel-${method}`) {
                    panel.classList.add('active');
                }
            });
        });
    });

    // Reset Checkout Modal helper
    function resetCheckoutModal() {
        // Reset forms
        document.getElementById('cardPaymentForm').reset();
        document.getElementById('upiId').value = '';
        document.getElementById('vpaStatusText').textContent = '';
        document.getElementById('vpaStatusText').className = 'vpa-status';
        
        // Deselect bank grids
        document.querySelectorAll('.bank-btn').forEach(bb => bb.classList.remove('selected'));
        
        // Reset statuses
        document.getElementById('checkoutStatusOverlay').classList.remove('active');
        document.getElementById('checkoutSpinner').style.display = 'block';
        document.getElementById('checkoutSuccessIcon').style.display = 'none';
        
        // Reset tab to Card
        payTabBtns[0].click();

        // Enable buttons
        document.getElementById('submitCardBtn').disabled = false;
        document.getElementById('submitUpiBtn').disabled = true;
        document.getElementById('submitBankBtn').disabled = true;
    }

    // Card Input Formattings
    const cardNumberInput = document.getElementById('cardNumber');
    cardNumberInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '');
        val = val.match(/.{1,4}/g)?.join(' ') || val;
        e.target.value = val;
    });

    const cardExpiryInput = document.getElementById('cardExpiry');
    cardExpiryInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 2) {
            val = val.substring(0, 2) + '/' + val.substring(2, 4);
        }
        e.target.value = val;
    });

    const cardCvvInput = document.getElementById('cardCvv');
    cardCvvInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
    });

    // UPI Validation
    const upiIdInput = document.getElementById('upiId');
    const verifyVpaBtn = document.getElementById('verifyVpaBtn');
    const vpaStatusText = document.getElementById('vpaStatusText');
    const submitUpiBtn = document.getElementById('submitUpiBtn');

    verifyVpaBtn.addEventListener('click', () => {
        const vpa = upiIdInput.value.trim();
        if (vpa.includes('@') && vpa.length > 3) {
            vpaStatusText.textContent = '✓ Verified (Harish Kumar M K)';
            vpaStatusText.className = 'vpa-status valid';
            submitUpiBtn.disabled = false;
        } else {
            vpaStatusText.textContent = '✗ Invalid UPI ID. Please check and try again.';
            vpaStatusText.className = 'vpa-status invalid';
            submitUpiBtn.disabled = true;
        }
    });

    // Net Banking Select
    document.querySelectorAll('.bank-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.bank-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            document.getElementById('submitBankBtn').disabled = false;
        });
    });

    // Handle payment submissions (Card, UPI, Bank)
    document.getElementById('cardPaymentForm').addEventListener('submit', () => {
        processPaymentSimulation('Card');
    });

    submitUpiBtn.addEventListener('click', () => {
        processPaymentSimulation('UPI');
    });

    document.getElementById('submitBankBtn').addEventListener('click', () => {
        const bankName = document.querySelector('.bank-btn.selected').getAttribute('data-bank');
        processPaymentSimulation(`NetBanking (${bankName})`);
    });

    // Payment processor trigger
    function processPaymentSimulation(method) {
        const totalSum = selectedFees.reduce((acc, curr) => acc + curr.current, 0);
        
        // Show loading status
        const overlay = document.getElementById('checkoutStatusOverlay');
        const spinner = document.getElementById('checkoutSpinner');
        const successIcon = document.getElementById('checkoutSuccessIcon');
        const title = document.getElementById('statusTitle');
        const desc = document.getElementById('statusDesc');

        overlay.classList.add('active');
        spinner.style.display = 'block';
        successIcon.style.display = 'none';
        title.textContent = 'Processing Payment...';
        desc.textContent = 'Connecting with banking gateways. Please do not refresh.';

        const now = new Date();
        const formattedDate = formatDate(now);
        const formattedTime = formatTime(now);
        const txnTimestamp = `${formattedDate} ${formattedTime}`;

        // 1. Simulating 2 seconds loading
        setTimeout(() => {
            spinner.style.display = 'none';
            successIcon.style.display = 'block';
            title.textContent = 'Payment Successful!';
            desc.textContent = `Amount: ${formatCurrency(totalSum)} | Ref: ${Math.floor(100000 + Math.random() * 900000)}`;

            // 2. Update Database States
            // Remove paid fees from pendingFees
            const selectedIds = selectedFees.map(f => f.id);
            pendingFees = pendingFees.filter(f => !selectedIds.includes(f.id));

            // Log attempt status
            const newTxnId = `TXN${Math.floor(800000 + Math.random() * 200000)}`;
            const feeTypesPaid = selectedFees.map(f => f.type).join(', ');
            
            // Add transaction log
            statusLog.unshift({
                txnId: newTxnId,
                datetime: txnTimestamp,
                type: feeTypesPaid,
                amount: totalSum,
                method: method,
                status: 'Success'
            });

            // Add receipt records
            selectedFees.forEach((fee, index) => {
                const receiptNo = `FR/2026/${Math.floor(1000 + Math.random() * 9000) + index}`;
                receiptsList.unshift({
                    receiptNo: receiptNo,
                    date: formattedDate,
                    type: fee.type,
                    course: fee.course,
                    amount: fee.current
                });
            });

            // Update Last Attempt time
            lastAttemptSpan.textContent = txnTimestamp;

            // 3. Clear checkout modal
            setTimeout(() => {
                closeModal(checkoutModal);
                
                // Re-render dashboard panels
                renderPendingFees();
                renderReceipts();
                renderPaymentStatus();
                
                // Route automatically to status or receipt tab to show success
                tabCards[1].click(); // Goto receipts tab
            }, 1800);

        }, 2200);
    }

    // Format date helpers
    function formatDate(date) {
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0'); // January is 0!
        const yyyy = date.getFullYear();
        return `${mm}/${dd}/${yyyy}`;
    }

    function formatTime(date) {
        let hours = date.getHours();
        let minutes = date.getMinutes();
        let seconds = date.getSeconds();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;
        seconds = seconds < 10 ? '0' + seconds : seconds;
        return `${hours}:${minutes}:${seconds} ${ampm}`;
    }


    // ==========================================================================
    // RECEIPT DETAILS PRINT / GENERATOR
    // ==========================================================================
    function openReceiptPrintModal(receipt) {
        const printableArea = document.getElementById('receiptPrintableArea');
        const receiptNo = receipt.receiptNo;
        
        // Dynamic content insertion matching college design
        printableArea.innerHTML = `
            <div class="receipt-wrapper">
                
                <!-- Receipt Header -->
                <div class="receipt-header-row">
                    <div class="receipt-logo">
                        <svg viewBox="0 0 100 100" style="width:100%; height:100%;">
                            <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" fill="#316150" stroke="#333" stroke-width="2"/>
                            <polygon points="50,12 82,28 82,72 50,88 18,72 18,28" fill="#539D82" stroke="#fff" stroke-width="1"/>
                            <path d="M50,20 L70,35 L70,60 L50,75 L30,60 L30,35 Z" fill="#fff"/>
                            <text x="50" y="47" font-size="10" font-weight="bold" fill="#316150" text-anchor="middle">RD & SH</text>
                            <line x1="35" y1="52" x2="65" y2="52" stroke="#316150" stroke-width="2"/>
                            <text x="50" y="66" font-size="8" font-weight="bold" fill="#316150" text-anchor="middle">ESTD 1949</text>
                        </svg>
                    </div>
                    <div class="receipt-college-info">
                        <h4 class="receipt-college-name">RD & SH NATIONAL COLLEGE AND SWA SCIENCE COLLEGE</h4>
                        <p class="receipt-college-sub">Smt. Jotu Kundnani Campus, Linking Road, Bandra (W), Mumbai - 400050</p>
                        <p class="receipt-college-sub">Affiliated to University of Mumbai | Accredited by NAAC</p>
                    </div>
                    <div class="receipt-title-box">
                        <h3 class="receipt-main-title">Fees Receipt</h3>
                        <span style="font-weight: 700; color: #718096; font-size: 11px;">ORIGINAL STUDENT COPY</span>
                    </div>
                </div>

                <!-- Meta Details Grid -->
                <div class="receipt-meta-grid">
                    <div class="meta-group">
                        <div class="meta-line">
                            <span class="m-lbl">Student Name:</span>
                            <span class="m-val">HARISH KUMAR MALLAIAH KALLEPALLI</span>
                        </div>
                        <div class="meta-line">
                            <span class="m-lbl">Student ID:</span>
                            <span class="m-val">5677181</span>
                        </div>
                        <div class="meta-line">
                            <span class="m-lbl">Course:</span>
                            <span class="m-val">${receipt.course}</span>
                        </div>
                    </div>
                    
                    <div class="meta-group">
                        <div class="meta-line">
                            <span class="m-lbl">Receipt Number:</span>
                            <span class="m-val" style="font-weight: 700; color: var(--color-primary-dark);">${receipt.receiptNo}</span>
                        </div>
                        <div class="meta-line">
                            <span class="m-lbl">Payment Date:</span>
                            <span class="m-val">${receipt.date}</span>
                        </div>
                        <div class="meta-line">
                            <span class="m-lbl">Academic Year:</span>
                            <span class="m-val">2026 - 2027</span>
                        </div>
                    </div>
                </div>

                <!-- Fees Breakdown Table -->
                <table class="receipt-items-table">
                    <thead>
                        <tr>
                            <th style="width: 60px;">Sr.No</th>
                            <th>Description / Particulars</th>
                            <th style="text-align: right; width: 150px;">Amount Paid</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="text-align: center;">1</td>
                            <td style="font-weight: 600;">${receipt.type} (Academic Year 2026-2027)</td>
                            <td style="text-align: right; font-weight: 600;">${formatCurrency(receipt.amount)}</td>
                        </tr>
                        <tr>
                            <td style="text-align: center;">2</td>
                            <td>University Enrollment & Registration Charges</td>
                            <td style="text-align: right; color: #a0aec0;">Included</td>
                        </tr>
                        <tr>
                            <td style="text-align: center;">3</td>
                            <td>Gymkhana, Laboratory & Computer Lab Service charges</td>
                            <td style="text-align: right; color: #a0aec0;">Included</td>
                        </tr>
                        <tr class="total-row">
                            <td colspan="2" style="text-align: right;">GRAND TOTAL</td>
                            <td style="text-align: right; color: var(--color-primary-dark);">${formatCurrency(receipt.amount)}</td>
                        </tr>
                    </tbody>
                </table>

                <!-- Footer Signatures -->
                <div class="receipt-footer-notes">
                    <div class="notes-left">
                        <h5>Important Note:</h5>
                        <p>1. This receipt is computer-generated and does not require a physical signature.</p>
                        <p>2. Fees once paid are non-refundable and subject to policies. Keep this document safe for future admissions or exam clearances.</p>
                        <p>3. Online payment is processed via safe payment gateway protocols.</p>
                    </div>
                    <div class="signature-box">
                        <div class="sig-line"></div>
                        <span class="sig-title">Accounts Officer / Cashier</span>
                    </div>
                </div>

            </div>
        `;

        openModal(receiptModal);
    }


    // ==========================================================================
    // INITIAL LOAD RENDERS
    // ==========================================================================
    renderPendingFees();
    renderReceipts();
    renderPaymentStatus();

});
