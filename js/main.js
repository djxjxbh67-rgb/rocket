document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Toggle Logic ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');

    // Check local storage or system preference
    const currentTheme = localStorage.getItem('theme') || 'dark';

    // Set initial theme
    const setTheme = (theme) => {
        htmlElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        if (theme === 'dark') {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        } else {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        }
    };

    // Apply initial theme
    setTheme(currentTheme);

    // Toggle theme on button click
    themeToggleBtn.addEventListener('click', () => {
        const newTheme = htmlElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });

    // --- Smooth Scrolling for Anchor Links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                });
            }
        });
    });

    // --- Form Validation and Submission ---
    // --- Telegram Anti-Spam Button ---
    const tgBtn = document.getElementById('tgBtn');
    if (tgBtn) {
        tgBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const encodedUser = this.getAttribute('data-tg');
            if (encodedUser) {
                window.open('https://t.me/' + atob(encodedUser), '_blank');
            }
        });
    }

    const contactForm = document.getElementById('contact-form');
    const phoneInput = document.getElementById('phone');
    const phoneError = document.getElementById('phone-error');
    const formSuccess = document.getElementById('form-success');

    // Make.com Webhook URL for Orders
    // ВСТАВЬТЕ СЮДА ВАШ НОВЫЙ WEBHOOK ИЗ MAKE.COM ДЛЯ ФОРМЫ ЗАКАЗА
    const MAKE_ORDER_WEBHOOK_URL = 'https://hook.us2.make.com/e87ed6i0di9p1qqdu6gdmmdxxe934fe9';

    if (contactForm && phoneInput && phoneError && formSuccess) {
        // Phone mask (simplified)
        phoneInput.addEventListener('input', function (e) {
            let x = e.target.value.replace(/\D/g, '').match(/(\d{0,1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/);
            if (!x[1]) return;
            let formatted = '+7 ';
            if (x[2]) formatted += '(' + x[2];
            if (x[3]) formatted += ') ' + x[3];
            if (x[4]) formatted += '-' + x[4];
            if (x[5]) formatted += '-' + x[5];
            e.target.value = formatted;
        });

        contactForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Honeypot check for spam bots
            if (document.getElementById('contact_honey')?.value) return;

            // Basic validation
            const phoneVal = phoneInput.value.replace(/\D/g, '');
            if (phoneVal.length < 11) {
                phoneError.classList.add('active');
                return;
            }
            phoneError.classList.remove('active');

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Отправка...';
            submitBtn.disabled = true;

            const name = document.getElementById('name').value;
            const phone = document.getElementById('phone').value;
            const subject = document.getElementById('form-subject').value;

            if (MAKE_ORDER_WEBHOOK_URL) {
                try {
                    const response = await fetch(MAKE_ORDER_WEBHOOK_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            name: name,
                            phone: phone,
                            subject: subject,
                            source: window.location.hostname
                        })
                    });

                    if (response.ok) {
                        formSuccess.textContent = '🎉 Спасибо! Заявка отправлена. Мы скоро свяжемся с вами.';
                        formSuccess.style.color = 'var(--success-color, #28a745)';
                    } else {
                        throw new Error('Network response was not ok.');
                    }
                } catch (error) {
                    console.error('Error sending order:', error);
                    formSuccess.textContent = '⚠️ Ошибка при отправке. Пожалуйста, напишите нам в Telegram.';
                    formSuccess.style.color = '#dc3545';
                }
            } else {
                // Simulation mode if webhook is not set
                console.log('Simulation Mode: Order submitted', { name, phone, subject });
                formSuccess.textContent = 'ℹ️ Тестовый режим: Заявка получена (Вебхук не настроен).';
            }

            formSuccess.classList.add('active');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;

            // Only reset form if successful (or simulated)
            if (MAKE_ORDER_WEBHOOK_URL === '' || formSuccess.textContent.includes('Спасибо') || formSuccess.textContent.includes('Тестовый')) {
                contactForm.reset();
                selectedPlan = null;
                selectedUpsells.clear();
                updateOrderUI(); // Reset the order container UI
            }

            // Hide message after 5 seconds
            setTimeout(() => {
                formSuccess.classList.remove('active');
            }, 6000);
        });
    }

    // ==========================================
    // Dynamic Order Form Logic
    // ==========================================
    const upsellButtons = document.querySelectorAll('.btn--upsell');
    const planButtons = document.querySelectorAll('.btn--plan');
    const formSubjectInput = document.getElementById('form-subject');
    const selectedItemsContainer = document.getElementById('selected-items-container');
    const selectedItemsList = document.getElementById('selected-items-list');

    let selectedPlan = null;
    let selectedUpsells = new Set();

    function updateOrderUI() {
        if (!selectedItemsContainer || !selectedItemsList || !formSubjectInput) return;

        selectedItemsList.innerHTML = '';
        let subjectParts = [];

        if (selectedPlan) {
            const li = document.createElement('li');
            li.innerHTML = `<strong>Тариф:</strong> ${selectedPlan}`;
            selectedItemsList.appendChild(li);
            subjectParts.push(`Тариф: ${selectedPlan}`);
        }

        if (selectedUpsells.size > 0) {
            selectedUpsells.forEach(upsell => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>Доп. услуга:</strong> ${upsell}`;
                selectedItemsList.appendChild(li);
                subjectParts.push(`Доп: ${upsell}`);
            });
        }

        if (selectedPlan || selectedUpsells.size > 0) {
            selectedItemsContainer.style.display = 'block';
            formSubjectInput.value = subjectParts.join(' | ');
        } else {
            selectedItemsContainer.style.display = 'none';
            formSubjectInput.value = 'Заявка на разработку';
        }
    }

    planButtons.forEach(btn => {
        // Save original text to restore when deselected
        if (!btn.getAttribute('data-original-text')) {
            btn.setAttribute('data-original-text', btn.textContent);
        }

        btn.addEventListener('click', function (e) {
            // Let the native anchor smooth scroll work, just update state
            const planName = this.getAttribute('data-plan');

            if (selectedPlan === planName) {
                // Toggle off
                selectedPlan = null;
            } else {
                // Toggle on
                selectedPlan = planName;
            }

            // Update UI for all plan buttons
            planButtons.forEach(pBtn => {
                if (pBtn.getAttribute('data-plan') === selectedPlan) {
                    pBtn.textContent = '✓ Выбран';
                    pBtn.classList.remove('btn--outline');
                    pBtn.classList.add('btn--primary');
                } else {
                    pBtn.textContent = pBtn.getAttribute('data-original-text');
                    // "Бизнес" plan default is primary, others are outline. Let's restore defaults based on data attribute or just let CSS handle it.
                    // Actually, the HTML structure: Business has btn--primary by default.
                    if (pBtn.getAttribute('data-plan').includes('Бизнес')) {
                        pBtn.classList.add('btn--primary');
                        pBtn.classList.remove('btn--outline');
                    } else {
                        pBtn.classList.add('btn--outline');
                        pBtn.classList.remove('btn--primary');
                    }
                }
            });

            updateOrderUI();

            // Highlight form only if adding
            if (selectedPlan) {
                const orderForm = document.getElementById('contact-form');
                if (orderForm) {
                    orderForm.style.boxShadow = '0 0 0 3px rgba(94, 23, 235, 0.3)';
                    setTimeout(() => orderForm.style.boxShadow = '', 1500);
                }
            }
        });
    });

    upsellButtons.forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const upsellName = this.getAttribute('data-upsell');

            if (selectedUpsells.has(upsellName)) {
                // Remove it
                selectedUpsells.delete(upsellName);
                this.textContent = 'Добавить к заказу';
                this.classList.remove('btn--primary');
                this.classList.add('btn--outline');
            } else {
                // Add it
                selectedUpsells.add(upsellName);
                this.textContent = '✓ Убрать из заказа';
                this.classList.remove('btn--outline');
                this.classList.add('btn--primary');

                // Scroll to order form ONLY when adding
                const orderSection = document.getElementById('order');
                if (orderSection) {
                    orderSection.scrollIntoView({ behavior: 'smooth' });
                }

                // Highlight form
                const orderForm = document.getElementById('contact-form');
                if (orderForm) {
                    orderForm.style.boxShadow = '0 0 0 3px rgba(94, 23, 235, 0.3)';
                    setTimeout(() => orderForm.style.boxShadow = '', 1500);
                }
            }
            updateOrderUI();
        });
    });

    // ==========================================
    // FAQ Accordion Logic
    // ==========================================
    const faqQuestions = document.querySelectorAll('.faq-item__question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const faqItem = question.parentElement;
            const isExpanded = question.getAttribute('aria-expanded') === 'true';

            // Close all other accordions
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
                if (item.querySelector('.faq-item__question')) {
                    item.querySelector('.faq-item__question').setAttribute('aria-expanded', 'false');
                }
            });

            // Toggle current
            if (!isExpanded) {
                faqItem.classList.add('active');
                question.setAttribute('aria-expanded', 'true');
            }
        });
    });

    // ==========================================
    // AI Chat Widget Logic
    // ==========================================
    const chatToggle = document.getElementById('chatToggle');
    const chatWindow = document.getElementById('chatWindow');
    const chatClose = document.getElementById('chatClose');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');

    // Make.com Webhook URL
    // ВСТАВЬТЕ СЮДА ВАШ WEBHOOK ИЗ MAKE.COM, НАПРИМЕР: 'https://hook.eu1.make.com/xxxxxxxxxxxxxxxxxxxxxxxxxxx'
    const MAKE_WEBHOOK_URL = 'https://hook.us2.make.com/n627zty7p6legfvvnxsp5ueuy96ud4u7';

    // Generate a unique session ID for the chat when the page loads
    const CHAT_SESSION_ID = Date.now().toString(36) + Math.random().toString(36).substring(2);

    if (chatToggle && chatWindow && chatClose) {
        // Toggle chat window
        chatToggle.addEventListener('click', () => {
            chatWindow.classList.add('is-open');
            setTimeout(() => chatInput.focus(), 300);
        });

        // Close chat window
        chatClose.addEventListener('click', () => {
            chatWindow.classList.remove('is-open');
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && chatWindow.classList.contains('is-open')) {
                chatWindow.classList.remove('is-open');
            }
        });

        // Handle sending messages
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Honeypot check
            if (document.getElementById('chat_honey')?.value) return;

            // Rate limiting: max 1 msg per 3 seconds
            if (window._chatLastMsgTime && Date.now() - window._chatLastMsgTime < 3000) {
                addMessage('Подождите пару секунд перед отправкой следующего сообщения 🕒', 'bot');
                return;
            }
            window._chatLastMsgTime = Date.now();

            const messageText = chatInput.value.trim();
            if (!messageText) return;

            // 1. Add user message
            addMessage(messageText, 'user');
            chatInput.value = '';

            // 2. Add typing indicator
            const typingIndicatorId = addTypingIndicator();

            if (MAKE_WEBHOOK_URL) {
                // REAL API CONNECTION VIA MAKE.COM
                try {
                    const response = await fetch(MAKE_WEBHOOK_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            message: messageText,
                            sessionId: CHAT_SESSION_ID
                        })
                    });

                    const rawText = await response.text();
                    removeTypingIndicator(typingIndicatorId);

                    try {
                        // Тот случай, когда Make.com смог вернуть правильный JSON
                        const data = JSON.parse(rawText);
                        if (data && data.reply) {
                            addMessage(data.reply, 'bot');
                        } else {
                            addMessage('Извините, я получил пустой ответ от сервера.', 'bot');
                        }
                    } catch (parseError) {
                        // Если JSON сломался из-за кавычек (invalid JSON), мы просто берем весь сырой текст!
                        if (rawText && rawText.trim().length > 0) {
                            addMessage(rawText, 'bot');
                        } else {
                            addMessage('Извините, я получил пустой ответ от сервера.', 'bot');
                        }
                    }
                } catch (error) {
                    removeTypingIndicator(typingIndicatorId);
                    addMessage('Произошла ошибка при подключении к серверу ИИ. Пожалуйста, попробуйте позже.', 'bot');
                    console.error('Chat AI Error:', error);
                }
            } else {
                // SIMULATION MODE (Demo before API is connected)
                setTimeout(() => {
                    removeTypingIndicator(typingIndicatorId);
                    const botResponse = generateSimulatedResponse(messageText.toLowerCase());
                    addMessage(botResponse, 'bot');
                }, 1500 + Math.random() * 1000); // 1.5 - 2.5s realistic delay
            }
        });
    }

    function addMessage(text, sender) {
        // Clean up text formatting from AI
        let formattedText = text || '';

        // 1. Convert Markdown bold
        formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

        // 2. Convert Markdown bullet lists
        formattedText = formattedText.replace(/(?:^|<br>)\s*\*\s+(.*?)(?=<br>|$)/g, '<br>• $1');

        // 3. Clean up excessive line breaks (replace 3+ breaks with just 2 for a single paragraph gap)
        formattedText = formattedText.replace(/(<br\s*\/?>\s*){3,}/gi, '<br><br>');

        // 4. Clean up breaks at the very beginning or end
        formattedText = formattedText.replace(/^(<br\s*\/?>)+|(<br\s*\/?>)+$/gi, '');

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message', `chat-message--${sender}`);
        messageDiv.innerHTML = formattedText;
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }

    function addTypingIndicator() {
        const id = 'typing-' + Date.now();
        const typingDiv = document.createElement('div');
        typingDiv.id = id;
        typingDiv.classList.add('chat-message', 'chat-message--bot', 'chat-message--typing');
        typingDiv.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        chatMessages.appendChild(typingDiv);
        scrollToBottom();
        return id;
    }

    function removeTypingIndicator(id) {
        const typingDiv = document.getElementById(id);
        if (typingDiv) {
            typingDiv.remove();
        }
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Simulated Bot Brain for Demo purposes
    function generateSimulatedResponse(text) {
        if (text.includes('цен') || text.includes('стоимост') || text.includes('скольк') || text.includes('тариф')) {
            return 'У нас есть 3 тарифа: <br><b>Базовый (от 15 000 ₽)</b> - для быстрого старта.<br><b>Бизнес (от 25 000 ₽)</b> - самый популярный выбор с интеграциями.<br><b>Премиум (от 30 000 ₽)</b> - VIP подход с уникальным дизайном и AI-ассистентом в подарок! <br><br>Оставьте заявку, и мы подберем идеальный для вас.';
        }
        if (text.includes('срок') || text.includes('долго') || text.includes('врем')) {
            return 'Мы создаем мощные лендинги экстремально быстро! Обычно от идеи до запуска проходит <b>всего 1-3 дня</b>. Скорость — наше главное преимущество.';
        }
        if (text.includes('ai') || text.includes('ии') || text.includes('нейро') || text.includes('бот') || text.includes('интеграц')) {
            return 'О, это моя любимая тема! 🤖 Мы можем внедрить на ваш сайт умного чат-бота (как я), который будет закрывать возражения клиентов 24/7, или настроить автогенерацию заявок в вашу CRM с помощью нейросетей.';
        }
        if (text.includes('привет') || text.includes('здравствуй') || text.includes('добрый')) {
            return 'Рад знакомству! Я здесь, чтобы помочь вашему бизнесу взлететь 🚀. Расскажите, для какой ниши вам нужен лендинг?';
        }
        if (text.includes('портфолио') || text.includes('пример') || text.includes('работ')) {
            return 'Вы можете посмотреть наши лучшие работы чуть выше в блоке "Наши работы". Мы делали крутые проекты для салонов красоты, доставки еды и мебельных фабрик!';
        }

        // Default response
        return 'Отличный вопрос! Чтобы я мог дать вам точный и развернутый ответ, пожалуйста, оставьте заявку в форме на сайте, и наш главный специалист свяжется с вами мгновенно.';
    }
});
