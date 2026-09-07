const FALLBACK = '/img/logo.png';

function isAstraTarget(img) {
    if (!(img instanceof HTMLImageElement)) return false;

    // Astra chat top-bar avatar
    if (img.matches('.astra-chat-top-bar__avatar')) return true;
    if (img.closest('.astra-chat-top-bar__avatar-frame')) return true;

    // Astra Home/current persona area, while avoiding recent-chat/message avatars.
    const parts = [];
    let el = img;
    for (let i = 0; i < 6 && el; i++, el = el.parentElement) {
        parts.push(`${el.className || ''}`.toLowerCase());
        if (el.id) parts.push(`#${el.id.toLowerCase()}`);
    }
    const chain = parts.join(' ');

    const looksAstra = chain.includes('astra');
    const looksHomeOrPersona =
        chain.includes('persona') ||
        chain.includes('current') ||
        chain.includes('avatar') ||
        chain.includes('home');

    const excluded =
        chain.includes('recent-chat') ||
        chain.includes('recent_chats') ||
        chain.includes('mes_avatar') ||
        chain.includes('message-avatar') ||
        chain.includes('chat-message');

    return looksAstra && looksHomeOrPersona && !excluded;
}

function applyFallback(img) {
    if (!img || img.dataset.astraLukerFallbackApplied === '1') return;
    img.dataset.astraLukerFallbackApplied = '1';
    img.src = FALLBACK;
}

function prepare(img) {
    if (!isAstraTarget(img)) return;
    if (img.dataset.astraLukerAvatarFixBound === '1') return;

    img.dataset.astraLukerAvatarFixBound = '1';

    img.addEventListener('error', () => {
        if (!img.src.endsWith('/img/logo.png')) {
            applyFallback(img);
        }
    });

    // Already failed before our listener attached.
    if (img.complete && img.naturalWidth === 0 && !img.src.endsWith('/img/logo.png')) {
        applyFallback(img);
    }
}

function scan(root = document) {
    if (root instanceof HTMLImageElement) {
        prepare(root);
        return;
    }
    root.querySelectorAll?.('img').forEach(prepare);
}

function start() {
    scan();

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node instanceof HTMLElement) scan(node);
            }
        }
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
    });

    console.info('[Astra Luker Avatar Fix] v1.1 loaded; fallback=/img/logo.png');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
    start();
}
