document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Toggle Logic ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');

    // Check local storage or system preference
    const currentTheme = localStorage.getItem('theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

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

    if (contactForm) {
        // Simple phone mask
        phoneInput.addEventListener('input', function (e) {
            let x = e.target.value.replace(/\D/g, '').match(/(\d{0,1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/);
            if (!x[1]) return;
            let formatted = '';
            if (x[1] === '7' || x[1] === '8') {
                formatted = '+7 ';
            } else {
                formatted = '+' + x[1] + ' ';
            }
            if (x[2]) formatted += '(' + x[2];
            if (x[3]) formatted += ') ' + x[3];
            if (x[4]) formatted += '-' + x[4];
            if (x[5]) formatted += '-' + x[5];
            e.target.value = formatted;
        });

        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Honeypot check
            if (document.getElementById('contact_honey')?.value) return;

            // Basic validation
            const phoneVal = phoneInput.value.replace(/\D/g, '');
            if (phoneVal.length < 11) {
                phoneError.classList.add('active');
                return;
            }
            phoneError.classList.remove('active');

            // Simulate sending data
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Отправка...';
            submitBtn.disabled = true;

            setTimeout(() => {
                formSuccess.classList.add('active');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                contactForm.reset();

                // Hide success message after 5 seconds
                setTimeout(() => {
                    formSuccess.classList.remove('active');
                }, 5000);
            }, 1000);
        });
    }

    // ==========================================
    // Upsell Buttons Logic
    // ==========================================
    const upsellButtons = document.querySelectorAll('.btn--upsell');
    const formSubjectInput = document.getElementById('form-subject');
    const selectedUpsellMsg = document.getElementById('selected-upsell-msg');
    const upsellNameSpan = document.getElementById('upsell-name');

    upsellButtons.forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const upsellName = this.getAttribute('data-upsell');

            if (formSubjectInput && selectedUpsellMsg && upsellNameSpan) {
                // Update form subject to include the upsell
                formSubjectInput.value = `Заявка с апселлом: ${upsellName}`;

                // Show the message to the user
                upsellNameSpan.textContent = upsellName;
                selectedUpsellMsg.style.display = 'block';

                // Scroll to the order form smoothly
                const orderSection = document.getElementById('order');
                if (orderSection) {
                    orderSection.scrollIntoView({ behavior: 'smooth' });
                }

                // Optionally visually highlight the form
                const orderForm = document.getElementById('contact-form');
                if (orderForm) {
                    orderForm.style.boxShadow = '0 0 0 3px rgba(94, 23, 235, 0.3)';
                    setTimeout(() => orderForm.style.boxShadow = '', 1500);
                }
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
