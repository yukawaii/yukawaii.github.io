const ScrollablePanel = {
    init(panel) {
        if (!panel) return;
        // Включаем скролл, но полностью скрываем полосу
        panel.style.overflow = 'auto';
        panel.style.scrollbarWidth = 'none';        // Firefox
        panel.style.msOverflowStyle = 'none';       // Edge (старый)
        panel.style.boxSizing = 'border-box';

        // Для WebKit (Chrome, Safari) – скрываем полосу через style-тег
        const styleId = panel.id + '-scroll-style';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                #${panel.id}::-webkit-scrollbar {
                    display: none; /* Safari и Chrome */
                    width: 0;
                    height: 0;
                }
            `;
            document.head.appendChild(style);
        }
    },

    // Пустышки для совместимости
    refresh() {},
    refreshAll() {},
    destroy() {}
};

window.addEventListener('resize', () => ScrollablePanel.refreshAll());
window.addEventListener('orientationchange', () => {
    setTimeout(() => ScrollablePanel.refreshAll(), 300);
});