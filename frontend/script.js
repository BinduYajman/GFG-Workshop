document.addEventListener('DOMContentLoaded', () => {
    // 1. Glassmorphism Header Scroll Effect
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Initial check for scroll position
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    }

    // 2. Fade-in Intersection Observer
    const fadeElements = document.querySelectorAll('.fade-in');
    const fadeObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    fadeElements.forEach(el => fadeObserver.observe(el));

    // 3. Cart Logic (localStorage + Drawer)
    let cart = JSON.parse(localStorage.getItem('aurelia_cart')) || [];
    const cartIcon = document.getElementById('cart-icon');
    const cartDrawer = document.getElementById('cart-drawer');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCart = document.getElementById('close-cart');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalAmount = document.getElementById('cart-total-amount');
    const cartCount = document.getElementById('cart-count');

    const toggleCart = () => {
        cartDrawer.classList.toggle('active');
        cartOverlay.classList.toggle('active');
        renderCart();
    };

    if (cartIcon) cartIcon.addEventListener('click', toggleCart);
    if (closeCart) closeCart.addEventListener('click', toggleCart);
    if (cartOverlay) cartOverlay.addEventListener('click', toggleCart);

    const updateCartCount = () => {
        if (cartCount) {
            cartCount.textContent = cart.reduce((acc, item) => acc + item.quantity, 0);
        }
    };

    const saveCart = () => {
        localStorage.setItem('aurelia_cart', JSON.stringify(cart));
        updateCartCount();
        renderCart();
    };

    window.addToCart = (id, name, price, image_url) => {
        const existingItem = cart.find(item => item.id === id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ id, name, price, image_url, quantity: 1 });
        }
        saveCart();
        toggleCart(); // Open drawer to show added item
    };

    window.removeFromCart = (id) => {
        cart = cart.filter(item => item.id !== id);
        saveCart();
        
        // Also update checkout page if we are there
        if (window.renderCheckoutCart) {
            window.renderCheckoutCart();
        }
    };

    const renderCart = () => {
        if (!cartItemsContainer) return;
        cartItemsContainer.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
        } else {
            cart.forEach(item => {
                total += item.price * item.quantity;
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('cart-item');
                itemDiv.innerHTML = `
                    <img src="${item.image_url}" alt="${item.name}">
                    <div class="cart-item-info">
                        <div>
                            <h4>${item.name}</h4>
                            <p>Qty: ${item.quantity}</p>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
                            <span class="remove-item" onclick="removeFromCart('${item.id}')">Remove</span>
                        </div>
                    </div>
                `;
                cartItemsContainer.appendChild(itemDiv);
            });
        }

        if (cartTotalAmount) {
            cartTotalAmount.textContent = `$${total.toFixed(2)}`;
        }
    };

    updateCartCount(); // Initial count

    // 4. Fetch Products for Home Page
    const shopGrid = document.getElementById('shop-grid');
    if (shopGrid) {
        fetch('/products')
            .then(res => res.json())
            .then(products => {
                products.forEach((p, index) => {
                    const delay = index * 0.2;
                    const card = document.createElement('div');
                    card.classList.add('product-card', 'fade-in');
                    card.style.transitionDelay = `${delay}s`;
                    card.innerHTML = `
                        <div class="product-img-wrapper" onclick="addToCart('${p.id}', '${p.name}', ${p.price}, '${p.image_url}')">
                            <img src="${p.image_url}" alt="${p.name}">
                        </div>
                        <div class="product-info">
                            <h3>${p.name}</h3>
                            <p>$${p.price.toFixed(2)}</p>
                            <button class="add-to-cart-btn" onclick="addToCart('${p.id}', '${p.name}', ${p.price}, '${p.image_url}')">Add to Cart</button>
                        </div>
                    `;
                    shopGrid.appendChild(card);
                    fadeObserver.observe(card); // Observe new element for fade-in
                });
            })
            .catch(err => console.error("Error fetching products:", err));
    }

    // 5. Chatbot Logic
    const chatBubble = document.getElementById('chat-bubble');
    const chatWindow = document.getElementById('chat-window');
    const closeChat = document.getElementById('close-chat');
    const chatInput = document.getElementById('chat-input-field');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatMessages = document.getElementById('chat-messages');

    if (chatBubble && chatWindow) {
        chatBubble.addEventListener('click', () => {
            chatWindow.classList.add('active');
            chatBubble.style.display = 'none';
        });

        closeChat.addEventListener('click', () => {
            chatWindow.classList.remove('active');
            chatBubble.style.display = 'flex';
        });
    }

    const appendMessage = (text, sender) => {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('msg', sender);
        msgDiv.textContent = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const sendMessage = async () => {
        const text = chatInput.value.trim();
        if (!text) return;

        appendMessage(text, 'user');
        chatInput.value = '';

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });

            if (response.ok) {
                const data = await response.json();
                setTimeout(() => {
                    appendMessage(data.response, 'bot');
                }, 600); 
            } else {
                appendMessage("Concierge unavailable at the moment.", 'bot');
            }
        } catch (error) {
            console.error('Chat Error:', error);
            appendMessage("An error occurred connecting to the concierge.", 'bot');
        }
    };

    if (chatSendBtn && chatInput) {
        chatSendBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    // 6. Contact Form
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(contactForm);
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            try {
                const response = await fetch('/contact', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    formStatus.textContent = data.message;
                    formStatus.style.color = 'var(--color-gold)';
                    contactForm.reset();
                } else {
                    formStatus.textContent = 'Error sending message.';
                    formStatus.style.color = 'red';
                }
            } catch (error) {
                console.error('Contact Form Error:', error);
            } finally {
                submitBtn.textContent = 'Send Inquiry';
                submitBtn.disabled = false;
            }
        });
    }
});
