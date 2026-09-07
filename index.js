const FALLBACK = '/img/ai4.png';

function isAstraTarget(img) {
    if (!(img instanceof HTMLImageElement)) return false;

    // Astra chat top-bar avatar
    if (img.matches('.astra-chat-top-bar__avatar')) return true;
    if (img.closest('.astra-chat-top-bar__avatar-frame')) return true;

    // Astra Home / current persona area.
    // Keep this intentionally scoped to Astra containers and avoid Recent Chats/message avatars.
    const cls = `${img.className || ''}`.toLowerCase();
    const parentText = `${img.parentElement?.className || ''}`.toLowerCase();
    const ancestry = [];
    let el = img.parentElement;
    for (let i = 0; i < 5 && el; i++, el = el.parentElement) {
        ancestry.push(`${el.className || ''}`.toLowerCase());
    }
    const chain = ancestry.join(' ');

    const looksAstra = cls.includes('astra') || parentText.includes('astra') || chain.includes('astra');
    const looksHomeOrPersona =
        cls.includes('persona') || cls.includes('current') || cls.includes('avatar') ||
        parentText.includes('persona') || parentText.includes('current') || parentText.includes('avatar') ||
        chain.includes('persona') || chain.includes('current-user') || chain.includes('home');

    const inRecentChats =
        chain.includes('recent-chat') || chain.includes('recent_chats') ||
        chain.includes('message') || chain.includes('mes_avatar');

    return looksAstra && looksHomeOrPersona && !inRecentChats;
}

function setFallback(img) {
    if (!img || img.dataset.astraLukerFallbackApplied === '1') return;
    img.dataset.astraLukerFallbackApplied = '1';
    img.src = FALLBACK;
}

function prepare(img) {
    if (!isAstraTarget(img)) return;
    if (img.dataset.astraLukerAvatarFixBound === '1') return;

    img.dataset.astraLukerAvatarFixBound = '1';

    img.addEventListener('error', () => {
        if (!img.src.endsWith('/img/ai4.png')) {
            setFallback(img);
        }
    });

    // Already failed before listener was attached.
    if (img.complete && img.naturalWidth === 0 && !img.src.endsWith('/img/ai4.png')) {
        setFallback(img);
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
        subtree: true
    });

    console.info('[Astra Luker Avatar Fix] loaded');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
    start();
}
